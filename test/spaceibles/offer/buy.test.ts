import { ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'
import { Balances, balances } from './helpers/balances'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/buy] buy asset via offer', () => {
	let deployer: SignerWithAddress

	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer

	let seller: SignerWithAddress
	let buyer: SignerWithAddress

	let money: ERC20Mock
	let moneyDecimals: number

	let buyTx: ContractTransaction

	before(
		'load offer/fixtures/deploy',
		async () => ({ deployer, spaceibleAsset, spaceibleOffer } = await loadFixture(deploySpaceibleOffer))
	)

	before('load seller and buyer signers', async () => ([, seller, buyer] = await ethers.getSigners()))

	before('deploy ERC20 Mock', async () => {
		money = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)

		moneyDecimals = await money.decimals()
	})

	const bps = 10000
	const operatorFee = 300

	const asset = {
		id: undefined, // initialize after mint tx
		cid: 'test-buy-tx',
		balance: 42,
		royalties: 500, // 5%
		data: '0x'
	}

	before(
		'mint asset as seller and assign id',
		async () =>
			await spaceibleAsset
				.connect(seller)
				.mint(asset.cid, asset.balance, asset.royalties, asset.data)
				.then(tx => tx.wait())
				.then(txr => (asset.id = getAssetID(txr)))
	)

	const offer = {
		id: undefined, // initialize after sell tx
		amount: asset.balance, // sell max balance
		price: parseUnits('100', moneyDecimals)
	}

	before(
		'approve for all as seller',
		async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
	)

	before(
		'create new offer as seller',
		async () =>
			await spaceibleOffer
				.connect(seller)
				.sell(asset.id, offer.amount, offer.price, money.address)
				.then(tx => tx.wait())
				.then(txr => (offer.id = getOfferId(txr)))
	)

	const buyAmount = 9
	const buyPrice = offer.price.mul(buyAmount)

	before('mint mock money to buyer', async () => await money.mintTo(buyer.address, buyPrice))

	before('set money allowance', async () => await money.connect(buyer).approve(spaceibleOffer.address, buyPrice))

	const actual: Balances = balances()
	const expected: Balances = balances()

	before('save balances before buy tx', async () => {
		actual.before.operator.money = await money.balanceOf(deployer.address)
		actual.before.buyer.asset = await spaceibleAsset.balanceOf(buyer.address, asset.id)
		actual.before.buyer.money = await money.balanceOf(buyer.address)
		actual.before.seller.asset = await spaceibleAsset.balanceOf(seller.address, asset.id)
		actual.before.seller.money = await money.balanceOf(seller.address)
	})

	let actualOfferAmountBefore
	before(
		'save available offer before  buy tx',
		async () => await spaceibleOffer.getOffer(offer.id).then(offer => (actualOfferAmountBefore = offer.amount))
	)

	before('asset buy tx', async () => (buyTx = await spaceibleOffer.connect(buyer).buy(offer.id, buyAmount)))

	before('safe balances after buy tx', async () => {
		actual.after.operator.money = await money.balanceOf(deployer.address)
		actual.after.buyer.asset = await spaceibleAsset.balanceOf(buyer.address, asset.id)
		actual.after.buyer.money = await money.balanceOf(buyer.address)
		actual.after.seller.asset = await spaceibleAsset.balanceOf(seller.address, asset.id)
		actual.after.seller.money = await money.balanceOf(seller.address)
	})

	before('set up expected balances values before', async () => {
		expected.before.operator.money = BigNumber.from('0')
		expected.before.buyer.money = buyPrice
		expected.before.buyer.asset = BigNumber.from('0')
		expected.before.seller.money = BigNumber.from('0')
		expected.before.seller.asset = BigNumber.from(asset.balance)
	})

	before('set up expected balances values after', async () => {
		const amountPrice = offer.price.mul(buyAmount)
		const royaltiesFeeAmount = '0' // seller is creator
		const operatorFeeAmount = amountPrice.mul(operatorFee).div(bps)
		const sellerFeeAmount = amountPrice.sub(royaltiesFeeAmount).sub(operatorFeeAmount)

		expected.after.operator.money = BigNumber.from(operatorFeeAmount)
		expected.after.buyer.money = BigNumber.from('0')
		expected.after.buyer.asset = BigNumber.from(buyAmount)
		expected.after.seller.money = sellerFeeAmount
		expected.after.seller.asset = BigNumber.from(asset.balance - buyAmount)
	})

	describe('seller/buyer/operator balances before assert', () => {
		it('operator should have correct money balance before', async () =>
			expect(actual.before.operator.money).to.be.eq(expected.before.operator.money))

		it('buyer should have correct money balance before', () =>
			expect(actual.before.buyer.money).to.be.eq(expected.before.buyer.money))

		it('buyer should have correct asset balance before', () =>
			expect(actual.before.buyer.asset).to.be.eq(expected.before.buyer.asset))

		it('seller should have correct asset balance before', () =>
			expect(actual.before.seller.asset).to.be.eq(expected.before.seller.asset))

		it('seller should have correct money balance before', () =>
			expect(actual.before.seller.money).to.be.eq(expected.before.seller.money))
	})

	describe('seller/buyer/operator balances after assert', () => {
		it('operator should have correct money balance after', () =>
			expect(actual.after.operator.money).to.be.eq(expected.after.operator.money))

		it('buyer should have correct money balance after', () =>
			expect(actual.after.buyer.money).to.be.eq(expected.after.buyer.money))

		it('buyer should have correct asset balance after', () =>
			expect(actual.after.buyer.asset).to.be.eq(expected.after.buyer.asset))

		it('seller should have correct money balance after', () =>
			expect(actual.after.seller.money).to.be.eq(expected.after.seller.money))

		it('seller should have correct asset balance after', () =>
			expect(actual.after.seller.asset).to.be.eq(expected.after.seller.asset))
	})

	describe('correct `Buy` event data', () => {
		let expectedBuyEventData
		before('set up expected buy event data', async () => {
			const amountPrice = offer.price.mul(buyAmount)
			const royaltiesFeeAmount = '0' // seller is creator
			const operatorFeeAmount = amountPrice.mul(operatorFee).div(bps)
			const sellerFeeAmount = amountPrice.sub(royaltiesFeeAmount).sub(operatorFeeAmount)

			expectedBuyEventData = {
				id: offer.id,
				amount: buyAmount,
				sellerFee: sellerFeeAmount,
				royaltiesFee: royaltiesFeeAmount,
				operatorFee: operatorFeeAmount
			}
		})

		it('should have correct `Buy` event data', async () => {
			await expect(buyTx)
				.to.emit(spaceibleOffer, 'Buy')
				.withArgs(
					expectedBuyEventData.id,
					expectedBuyEventData.amount,
					expectedBuyEventData.sellerFee,
					expectedBuyEventData.royaltiesFee,
					expectedBuyEventData.operatorFee
				)
		})
	})

	describe('buy asset via offer: assert offer amount before/after buy tx', () => {
		const expected = {
			offer: {
				amount: {
					before: 42,
					after: 33
				}
			}
		}

		let actualAfter
		before(
			'save available offer before  buy tx',
			async () => await spaceibleOffer.getOffer(offer.id).then(offer => (actualAfter = offer.amount))
		)

		it('should be different offer amount after and before', async () =>
			expect(actualAfter).not.to.be.eq(actualOfferAmountBefore))

		it('should have correct value for offer amount before buy tx', async () =>
			expect(actualOfferAmountBefore).to.be.eq(expected.offer.amount.before))

		it('should have correct value for offer amount after buy tx', async () =>
			expect(actualAfter).to.be.eq(expected.offer.amount.after))
	})
})
