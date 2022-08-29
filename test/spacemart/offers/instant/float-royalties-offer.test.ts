import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { BigNumber, BigNumberish } from 'ethers'
import { expect } from 'chai'
import { parseUnits } from '@ethersproject/units'
import { PayloadAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../../typechain'
import contractNames from '../../../../constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../../../constants/tx-receipt-status'
import { getOfferSellID } from '../../../helpers/getOfferId.helper'
import { formatUnits } from 'ethers/lib/utils'
import { deployInstantOfferWithFloatFeesAndRoyalties } from './fixtures/deployOffer.fixture'

describe('[spacemart/offers/instant/float-royalties-offer.test] Instant offer with royalties', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber

	const rootId = 0

	let userA: SignerWithAddress
	let userB: SignerWithAddress

	before('load userA and userB as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	before(
		'load fixture',
		async () =>
			({ deployer, creator, instantOffer, payloadAsset, kycContract, totalSupply } = await waffle.loadFixture(
				deployInstantOfferWithFloatFeesAndRoyalties
			))
	)

	let erc20Mock: ERC20Mock
	before('deploy ERC20 Mock', async () => {
		const name = 'MockToken'
		const symbol = 'MT'
		const decimals = 18

		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy(name, symbol, decimals))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	let offerId: BigNumberish
	const price = parseUnits('4250', 18)
	const minBuyAmount = parseUnits('10', 18)
	it('should create new offer', async () => {
		await payloadAsset.connect(creator).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(creator)
			.sell(payloadAsset.address, rootId, totalSupply.div(100), minBuyAmount, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	const buyAmount = parseUnits('10', 18)

	const erc20MintAmountForBuyers = parseUnits('10000000', 18)

	it('should have success status of buy tx', async () => {
		expect(await payloadAsset.balanceOf(creator.address, rootId)).to.be.eq(totalSupply)
		const approveAmount = formatUnits(price.mul(buyAmount), 18).replace('.0', '')
		await erc20Mock.connect(userA).mint(erc20MintAmountForBuyers)
		await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
		await kycContract.connect(deployer).setKycStatus(userA.address, true)

		const txr = await instantOffer
			.connect(userA)
			.buy(offerId, buyAmount)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(await payloadAsset.balanceOf(creator.address, rootId), 'wrong creator balance of sold asset').to.be.eq(
			totalSupply.sub(buyAmount)
		)
		expect(await payloadAsset.balanceOf(userA.address, rootId), 'wrong balance of buyer after tx buy').to.be.eq(
			buyAmount
		)
		expect(await erc20Mock.balanceOf(creator.address), 'wrong erc20 creator balance after sold asset').to.be.eq(
			approveAmount
		)
	})

	let resellOfferId: BigNumberish
	const resellPrice = parseUnits('5000', 18)
	it('userA should be able to create resell offer with royalties included', async () => {
		// approve offer contract before create sell offer
		await payloadAsset.connect(userA).setApprovalForAll(instantOffer.address, true)
		const userABalance = await payloadAsset.balanceOf(userA.address, rootId)

		const txr = await instantOffer
			.connect(userA)
			.sell(payloadAsset.address, rootId, userABalance, minBuyAmount, resellPrice, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		resellOfferId = getOfferSellID(txr)
	})

	it('userB should be able to buy resell offer with royalties', async () => {
		const balanceCreatorBefore = await erc20Mock.balanceOf(creator.address)
		const balanceUserABefore = await erc20Mock.balanceOf(userA.address)
		expect(await payloadAsset.balanceOf(userA.address, rootId)).to.be.eq(buyAmount)

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
		expect(await payloadAsset.balanceOf(userA.address, rootId)).to.be.eq(0)
		expect(await payloadAsset.balanceOf(userB.address, rootId)).to.be.eq(buyAmount)

		// check royalties balances of platformOperator and assetCreator (should include firstDeal profit + royalties)
		const platformFee = secondDealTotalPrice.mul(3250).div(100000)
		expect(await erc20Mock.balanceOf(await instantOffer.platformOperator())).to.be.eq(platformFee)

		const royaltiesAmount = secondDealTotalPrice.mul(5750).div(100000)
		const balanceCreatorAfter = await erc20Mock.balanceOf(creator.address)
		const expectedDiff = balanceCreatorAfter.sub(balanceCreatorBefore)

		expect(expectedDiff).to.be.eq(royaltiesAmount)

		// check the userA balance as a reseller
		expect(await erc20Mock.balanceOf(userA.address)).to.be.eq(
			balanceUserABefore.add(secondDealTotalPrice.sub(royaltiesAmount).sub(platformFee))
		)
	})
})
