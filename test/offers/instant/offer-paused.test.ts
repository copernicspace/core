import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { BigNumber, BigNumberish } from 'ethers'
import { expect } from 'chai'
import { parseUnits } from '@ethersproject/units'
import { CargoAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../typechain'
import contractNames from '../../../constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getOfferSellID } from '../../helpers/getOfferId.helper'
import { deployInstantOffer } from './fixtures/deployOffer.fixture'
import { kyc } from '../../asset/cargo/fixtures/kyc.fixture'

describe('[test/offers/instant/offer-paused.test] Instant offer: paused', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber

	const rootId = 0

	let buyer: SignerWithAddress
	before('load buyer as signerWithAddress', async () => ([, , buyer] = await ethers.getSigners()))

	const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()
	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, instantOffer, cargoContract, kycContract, totalSupply } = await loadFixture(
				deployInstantOffer
			))
	)
	let decimals: BigNumber
	before('get decimals', async () => (decimals = await cargoContract.decimals()))

	let erc20Mock: ERC20Mock
	before('deploy ERC20 Mock', async () => {
		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	before('add buyer to KYC', async () => await kycContract.connect(deployer).setKycStatus(buyer.address, true))

	const price = parseUnits('4250', decimals)
	let offerId: BigNumberish

	before('create a new offer', async () => {
		await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)
		await cargoContract.connect(buyer).setApprovalForAll(instantOffer.address, true)

		const minBuyAmount = parseUnits('100', decimals)
		const txr = await instantOffer
			.connect(creator)
			.sell(cargoContract.address, rootId, totalSupply.div(100), minBuyAmount, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	describe('offer creation when asset paused', async () => {
		before('transfer funds to buyer', async () => {
			await cargoContract.connect(creator).transfer(buyer.address, 0, parseUnits('100', decimals))
		})
		before('pause asset', async () => {
			await cargoContract.connect(creator).pause()
		})

		it('reverts create offer from non-creator', async () => {
			await expect(
				instantOffer.connect(buyer).sell(cargoContract.address, 0, '100', '100', price, erc20Mock.address)
			).to.be.revertedWith('PausableCargo: asset is locked')
		})

		it('successfully creates offer if `msg.sender == creator`', async () => {
			const createOfferTx = await instantOffer
				.connect(creator)
				.sell(cargoContract.address, 0, '100', '10', price, erc20Mock.address)
				.then(tx => tx.wait())

			expect(await createOfferTx.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		})
	})

	describe('offer resell of paused asset', async () => {
		before('transfer funds to buyer', async () => {
			await erc20Mock.connect(buyer).mint(parseUnits('100000000', 18))
		})
		before('approve buyer buy', async () => {
			const buyAmountDecimal = '100'
			const approveAmount = price.mul(buyAmountDecimal)
			await erc20Mock.connect(buyer).approve(instantOffer.address, approveAmount)
		})

		it('allows buyer to buy asset', async () => {
			const balanceBefore = await cargoContract.balanceOf(buyer.address, 0)
			const decimalBuyAmount = '100'
			await instantOffer.connect(buyer).buy(0, decimalBuyAmount)
			const balanceAfter = await cargoContract.balanceOf(buyer.address, 0)
			const expected = parseUnits(decimalBuyAmount, decimals)
			expect(expected).to.be.eq(balanceAfter.sub(balanceBefore))
		})

		it('disallows resell from non-creator', async () => {
			await cargoContract.connect(creator).transfer(buyer.address, 0, '100')
			await expect(
				instantOffer.connect(buyer).sell(cargoContract.address, 0, '100', '100', '5000', erc20Mock.address)
			).to.be.revertedWith('PausableCargo: asset is locked')
		})
	})

	describe('offer creation when asset NOT paused', async () => {
		before('unpause asset', async () => {
			await cargoContract.connect(creator).unpause()
		})

		it('successfully creates offer from any user', async () => {
			const createOfferTx = await instantOffer
				.connect(buyer)
				.sell(cargoContract.address, 0, '100', '100', price, erc20Mock.address)
				.then(tx => tx.wait())

			expect(await createOfferTx.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		})
	})
})
