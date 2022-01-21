import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { deployInstantOffer } from './fixtures/deployInstantOffer.fixture'
import { CargoAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../typechain'
import contractNames from '../../../constants/contract.names'
import { BigNumber, BigNumberish } from 'ethers'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getOfferSellID } from '../../helpers/getOfferId.helper'
import { parseUnits } from '@ethersproject/units'

describe('instant offer: `buy` test suite', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber

	const rootId = 0

	let userA: SignerWithAddress

	before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, instantOffer, cargoContract, kycContract, totalSupply } = await waffle.loadFixture(
				deployInstantOffer
			))
	)

	let erc20Mock: ERC20Mock
	before(' deploy ERC20 Mock', async () => {
		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	let offerId: BigNumberish
	const price = parseUnits('4250', 18)
	it('should create new offer', async () => {
		// approve offer contract before create sell offer
		await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(creator)
			.sell(cargoContract.address, rootId, totalSupply, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	const buyAmountDecimal = '100'
	const buyAmountUint = parseUnits(buyAmountDecimal, 18)
	it('should have success status of buy tx', async () => {
		expect(await cargoContract.balanceOf(creator.address, rootId)).to.be.eq(totalSupply)
		const approveAmount = price.mul(buyAmountDecimal)
		await erc20Mock.connect(userA).mint(parseUnits('10000000', 18))
		await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
		await kycContract.connect(deployer).setKycStatus(userA.address, true)

		const buyTxr = await instantOffer
			.connect(userA)
			.buy(offerId, buyAmountDecimal)
			.then(tx => tx.wait())

		expect(await cargoContract.balanceOf(creator.address, rootId)).to.be.eq(totalSupply.sub(buyAmountUint))
		expect(await cargoContract.balanceOf(userA.address, rootId)).to.be.eq(buyAmountUint)
	})

	let smartOfferParams
	describe('set the parameters correctly', async () => {
		before('get smart offer parameters', async () => {
			smartOfferParams = await instantOffer.getSmartOffer(offerId)
		})

		it('set the seller correctly', async () => {
			await expect(smartOfferParams.seller).to.be.eq(creator.address)
		})
		it('set the assetID correctly', async () => {
			await expect(smartOfferParams.assetID).to.be.eq(rootId)
		})
		it('set the price correctly', async () => {
			await expect(smartOfferParams.price).to.be.eq(price)
		})
		it('set the money address correctly', async () => {
			await expect(smartOfferParams.money).to.be.eq(erc20Mock.address)
		})
		it('set the sellID correctly', async () => {
			await expect(smartOfferParams.sellID).to.be.eq(offerId)
		})
	})

	describe('reverts `sell()` if requirements not met', async () => {
		it('reverts if insufficient balance', async () => {
			await expect(
				instantOffer.connect(creator).sell(cargoContract.address, rootId, totalSupply, price, erc20Mock.address)
			).to.be.revertedWith('Failed to create new sell, insuffucient balance')
		})
		it('reverts if seller not ApprovedForAll', async () => {
			// set approval to false
			await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, false)
			await expect(
				instantOffer
					.connect(creator)
					.sell(cargoContract.address, rootId, BigNumber.from(1), price, erc20Mock.address)
			).to.be.revertedWith('his contract has no approval to operate sellers assets')

			// re-add approval
			await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)
		})
	})

	describe('toggle isActive status', async () => {
		it('sets correct start status', async () => {
			const startStatus = await instantOffer.getOfferStatus(offerId)
			expect(startStatus).to.be.true
		})
		it('allows disabling active offer', async () => {
			const startStatus = await instantOffer.getOfferStatus(offerId)
			await instantOffer.connect(creator).toggleOfferActive(offerId)
			const endStatus = await instantOffer.getOfferStatus(offerId)
			expect(startStatus).to.be.true
			expect(endStatus).to.be.false
		})
		it('allows enabling active offer', async () => {
			const startStatus = await instantOffer.getOfferStatus(offerId)
			await instantOffer.connect(creator).toggleOfferActive(offerId)
			const endStatus = await instantOffer.getOfferStatus(offerId)
			expect(startStatus).to.be.false
			expect(endStatus).to.be.true
		})
		it('reverts if trying to set status from non-creator account', async () => {
			await expect(instantOffer.connect(userA).toggleOfferActive(offerId)).to.be.revertedWith(
				'Cannot set offer status: not seller'
			)
		})
	})

	describe('reverts `buy()` if requirements not met', async () => {
		it('reverts if insufficient ERC20 balance', async () => {
			const buyAmountDecimal = '10000' // 10e4
			/*
				price 			= 4.25 * 10e3
				buy amount 		= 10e4
				decimals		= 10e18

				total ERC balance requirement (total price) = 4.25 * 10e25
				available balance = 9.575 * 10e24 (lower than total price)
			*/
			// approve for higher cost
			const approveAmount = price.mul(buyAmountDecimal)
			await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)

			// check if reverts due to insufficient ER20
			await expect(instantOffer.connect(userA).buy(offerId, buyAmountDecimal)).to.be.revertedWith(
				'ERC20: transfer amount exceeds balance'
			)
		})
		it('reverts if trying to buy more than is on sale', async () => {
			// available = 3400
			const buyAmountDecimal = '10000'
			// approve for 10e4 purchase
			await erc20Mock.connect(userA).mint(parseUnits('100000000', 18))
			const approveAmount = price.mul(buyAmountDecimal)
			await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
			// check if ERC1155 revert
			await expect(instantOffer.connect(userA).buy(offerId, buyAmountDecimal)).to.be.revertedWith(
				'ERC1155: insufficient balance for transfer'
			)
		})
		it('reverts if insufficient approval amount', async () => {
			const buyAmountDecimal = '1000' // 10e3

			// approve for lower cost
			const approveAmount = price.mul(buyAmountDecimal).div(2)
			await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)

			// check if reverts due to insufficient approval amount
			await expect(instantOffer.connect(userA).buy(offerId, buyAmountDecimal)).to.be.revertedWith(
				'Insufficient balance via allowance to purchase'
			)
		})
		it('reverts if offer set to inactive', async () => {
			// set offer to inactive
			await instantOffer.connect(creator).toggleOfferActive(offerId)

			await expect(instantOffer.connect(userA).buy(offerId, '1')).to.be.revertedWith('Revert: offer not active')
		})
	})
})
