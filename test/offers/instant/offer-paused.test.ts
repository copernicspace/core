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

describe('[test/offers/instant/offer-paused.test] Instant offer: deployOffer fixture test suite', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber

	const rootId = 0

	let userA: SignerWithAddress

	before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

	const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()
	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, instantOffer, cargoContract, kycContract, totalSupply } = await loadFixture(
				deployInstantOffer
			))
	)

	let erc20Mock: ERC20Mock
	before('deploy ERC20 Mock', async () => {
		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	const price = parseUnits('4250', 18)
	let offerId: BigNumberish
	before('create a new offer', async () => {
		// approve offer contract before create sell offer
		await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)
		await cargoContract.connect(userA).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(creator)
			.sell(cargoContract.address, rootId, totalSupply, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	describe('offer creation when asset paused', async () => {
		before('transfer funds to userA', async () => {
			await cargoContract.connect(creator).transfer(userA.address, 0, '100')
		})
		before('pause asset', async () => {
			await cargoContract.connect(creator).pause()
		})

		it('reverts create offer from non-creator', async () => {
			await expect(
				instantOffer.connect(userA).sell(cargoContract.address, 0, '100', price, erc20Mock.address)
			).to.be.revertedWith('PausableCargo: asset is locked')
		})

		it('successfully creates offer if `msg.sender == creator`', async () => {
			const createOfferTx = await instantOffer
				.connect(creator)
				.sell(cargoContract.address, 0, '100', price, erc20Mock.address)
				.then(tx => tx.wait())

			expect(await createOfferTx.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		})
	})

	describe('offer resell of paused asset', async () => {
		before('transfer funds to userA', async () => {
			await erc20Mock.connect(userA).mint(parseUnits('100000000', 18))
		})
		before('approve userA buy', async () => {
			const buyAmountDecimal = '100'
			const approveAmount = price.mul(buyAmountDecimal)
			await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
		})

		it('allows userA to buy asset', async () => {
			await instantOffer.connect(userA).buy(0, '100')
			expect(await cargoContract.balanceOf(userA.address, '0')).to.be.eq(
				parseUnits('100', await cargoContract.decimals()).add(100)
			)
		})

		it('disallows resell from non-creator', async () => {
			await expect(
				instantOffer.connect(userA).sell(cargoContract.address, 0, '100', '5000', erc20Mock.address)
			).to.be.revertedWith('PausableCargo: asset is locked')
		})
	})

	describe('offer creation when asset NOT paused', async () => {
		before('unpause asset', async () => {
			await cargoContract.connect(creator).unpause()
		})

		it('successfully creates offer from any user', async () => {
			const createOfferTx = await instantOffer
				.connect(userA)
				.sell(cargoContract.address, 0, '100', price, erc20Mock.address)
				.then(tx => tx.wait())

			expect(await createOfferTx.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		})
	})
})
