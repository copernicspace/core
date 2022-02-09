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

describe('[test/offers/instant/offer.test] Instant offer: deployOffer fixture test suite', () => {
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
		const minBuyAmount = parseUnits('10', 18)
		const txr = await instantOffer
			.connect(creator)
			.sell(cargoContract.address, rootId, totalSupply.div(100), minBuyAmount, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	const buyAmountDecimal = '10'
	const buyAmountUint = parseUnits(buyAmountDecimal, 18)

	it('should have success status of buy tx', async () => {
		const balanceBefore = await cargoContract.balanceOf(creator.address, rootId)
		const approveAmount = price.mul(buyAmountDecimal)
		await erc20Mock.connect(userA).mint(parseUnits('10000000', 18))
		await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
		await kycContract.connect(deployer).setKycStatus(userA.address, true)

		const txr = await instantOffer
			.connect(userA)
			.buy(offerId, buyAmountDecimal)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(
			await cargoContract.balanceOf(creator.address, rootId),
			'wrong balance of creator after success sell tx'
		).to.be.eq(balanceBefore.sub(buyAmountUint))

		expect(
			await cargoContract.balanceOf(userA.address, rootId),
			'wrong balance of user A, after success buy tx'
		).to.be.eq(buyAmountUint)
	})
})
