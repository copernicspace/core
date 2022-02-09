import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { BigNumber, BigNumberish } from 'ethers'
import { expect } from 'chai'
import { parseUnits } from '@ethersproject/units'
import { CargoAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../typechain'
import contractNames from '../../../constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getOfferSellID } from '../../helpers/getOfferId.helper'
import { deployInstantOfferWithRoyalties } from './fixtures/deployRoyaltiesOffer.fixture.'
import { formatUnits } from 'ethers/lib/utils'

describe('[test/offers/instant/royalties-offer.test] Instant offer with royalties', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber

	const rootId = 0

	let userA: SignerWithAddress
	let userB: SignerWithAddress

	const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()
	before('load userA and userB as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOfferWithRoyalties`',
		async () =>
			({ deployer, creator, instantOffer, cargoContract, kycContract, totalSupply } = await loadFixture(
				deployInstantOfferWithRoyalties
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

	let offerId: BigNumberish
	const price = parseUnits('4250', 18)
	const minBuyAmountUint = parseUnits('10', 18)
	it('should create new offer', async () => {
		// approve offer contract before create sell offer
		await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(creator)
			.sell(cargoContract.address, rootId, totalSupply.div(100), minBuyAmountUint, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	const buyAmount = parseUnits('10', 18)
	const erc20MintAmountForBuyers = parseUnits('10000000', 18)
	it('should have success status of buy tx', async () => {
		expect(await cargoContract.balanceOf(creator.address, rootId)).to.be.eq(totalSupply)
		const approveAmount = formatUnits(price.mul(buyAmount)).replace('.0', '')
		await erc20Mock.connect(userA).mint(erc20MintAmountForBuyers)
		await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
		await kycContract.connect(deployer).setKycStatus(userA.address, true)

		const txr = await instantOffer
			.connect(userA)
			.buy(offerId, buyAmount)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(await cargoContract.balanceOf(creator.address, rootId)).to.be.eq(totalSupply.sub(buyAmount))
		expect(await cargoContract.balanceOf(userA.address, rootId)).to.be.eq(buyAmount)
		expect(await erc20Mock.balanceOf(creator.address)).to.be.eq(approveAmount)
	})

	let resellOfferId: BigNumberish
	const resellPrice = parseUnits('5000', 18)
	it('userA should be able to create resell offer with royalties included', async () => {
		// approve offer contract before create sell offer
		await cargoContract.connect(userA).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(userA)
			.sell(cargoContract.address, rootId, buyAmount, minBuyAmountUint, resellPrice, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		resellOfferId = getOfferSellID(txr)
	})

	it('userB should be able to buy resell offer with royalties', async () => {
		const balanceCreatorBefore = await erc20Mock.balanceOf(creator.address)
		const balanceUserABefore = await erc20Mock.balanceOf(userA.address)
		expect(await cargoContract.balanceOf(userA.address, rootId)).to.be.eq(buyAmount)

		const secondDealTotalPrice = BigNumber.from(formatUnits(resellPrice.mul(buyAmount), 18).replace('.0', ''))
		await erc20Mock.connect(userB).mint(erc20MintAmountForBuyers)
		await erc20Mock.connect(userB).approve(instantOffer.address, secondDealTotalPrice)
		await kycContract.connect(deployer).setKycStatus(userB.address, true)

		const txr = await instantOffer
			.connect(userB)
			.buy(resellOfferId, buyAmount)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		// check the balance of transfered asset tokens
		expect(await cargoContract.balanceOf(userA.address, rootId)).to.be.eq(0)
		expect(await cargoContract.balanceOf(userB.address, rootId)).to.be.eq(buyAmount)

		// check royalties balances of platformOperator and assetCreator (should include firstDeal profit + royalties)
		const platformFee = secondDealTotalPrice.mul(3).div(100)
		expect(await erc20Mock.balanceOf(await instantOffer.platformOperator())).to.be.eq(platformFee)

		const royaltiesAmount = secondDealTotalPrice.mul(5).div(100)
		const balanceCreatorAfter = await erc20Mock.balanceOf(creator.address)
		const expectedDiff = balanceCreatorAfter.sub(balanceCreatorBefore)

		expect(expectedDiff).to.be.eq(royaltiesAmount)

		// check the userA balance as a reseller
		expect(await erc20Mock.balanceOf(userA.address)).to.be.eq(
			balanceUserABefore.add(secondDealTotalPrice.sub(royaltiesAmount).sub(platformFee))
		)
	})
})
