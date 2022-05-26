import { BigNumber } from '@ethersproject/bignumber'
import { ContractReceipt, ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { parseUnits } from 'ethers/lib/utils'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { deploySpaceibleAsset } from '../asset/fixtures/deploy.fixture'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/buy]', () => {
	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer

	let deployer: SignerWithAddress

	let seller: SignerWithAddress
	let buyer: SignerWithAddress

	let mintTx: ContractTransaction
	let mintTxr: ContractReceipt

	let sellTx: ContractTransaction
	let sellTxr: ContractReceipt

	let newOffer: {
		seller: string
		assetAddress: string
		assetId: BigNumber
		amount: BigNumber
		price: BigNumber
		money: string
	}

	let operatorMoneyBalanceBefore: BigNumber, operatorMoneyBalanceAfter: BigNumber

	let buyerAssetBalanceBefore: BigNumber, buyerAssetBalanceAfter: BigNumber
	let buyerMoneyBalanceBefore: BigNumber, buyerMoneyBalanceAfter: BigNumber

	let sellerMoneyBalanceBefore: BigNumber, sellerMoneyBalanceAfter
	let sellerAssetBalanceBefore: BigNumber, sellerAssetBalanceAfter

	let buyTx: ContractTransaction
	let buyTxr: ContractReceipt

	let money: ERC20Mock
	let moneyDecimals: number

	describe('buy asset via offer', () => {
		before('load asset/fixtures/deploy', async () => ({ spaceibleAsset } = await loadFixture(deploySpaceibleAsset)))

		before(
			'load offer/fixtures/deploy',
			async () => ({ deployer, spaceibleOffer } = await loadFixture(deploySpaceibleOffer))
		)

		before('deploy ERC20 Mock', async () => {
			money = await ethers
				.getContractFactory(contractNames.ERC20_MOCK)
				.then(factory => factory.deploy())
				.then(contract => contract.deployed())
				.then(deployedContract => deployedContract as ERC20Mock)

			moneyDecimals = await money.decimals()
		})
		before('load seller', async () => ([, seller, buyer] = await ethers.getSigners()))

		const asset = {
			id: undefined,
			cid: 'mockCID-deployer-0x123abc',
			balance: 100,
			royalties: 500,
			data: '0x'
		}

		before('mint asset as seller and assign id', async () => {
			mintTx = await spaceibleAsset.connect(seller).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			mintTxr = await mintTx.wait()
		})

		before('assign asset id from mint tx receipt', async () => (asset.id = getAssetID(mintTxr)))

		const offer = {
			id: undefined,
			amount: 100,
			price: parseUnits('100', moneyDecimals)
		}

		before(
			'approve for all as seller',
			async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
		)

		before('create new offer', async () => {
			sellTx = await spaceibleOffer
				.connect(seller)
				.sell(spaceibleAsset.address, asset.id, offer.amount, offer.price, money.address)

			sellTxr = await sellTx.wait()
		})

		before('assign new sell offer id', async () => (offer.id = getOfferId(sellTxr)))

		before(
			'read new offer`s data from chain',
			async () => (newOffer = await spaceibleOffer.getSmartOffer(offer.id))
		)

		const buyAmount = 1
		const buyPrice = offer.price.mul(buyAmount)

		before('mint mock money to buyer', async () => await money.mintTo(buyer.address, buyPrice))

		before('set money allowance', async () => await money.connect(buyer).approve(spaceibleOffer.address, buyPrice))

		before('safe balances before buy tx', async () => {
			operatorMoneyBalanceBefore = await money.balanceOf(deployer.address)

			buyerAssetBalanceBefore = await spaceibleAsset.balanceOf(buyer.address, asset.id)
			buyerMoneyBalanceBefore = await money.balanceOf(buyer.address)

			sellerAssetBalanceBefore = await spaceibleAsset.balanceOf(seller.address, asset.id)
			sellerMoneyBalanceBefore = await money.balanceOf(seller.address)
		})

		before('asset buy tx', async () => (buyTx = await spaceibleOffer.connect(buyer).buy(offer.id, 1)))
		before('asset buy tx receipt', async () => (buyTxr = await buyTx.wait()))

		before('safe balances after buy tx', async () => {
			operatorMoneyBalanceAfter = await money.balanceOf(deployer.address)

			buyerAssetBalanceAfter = await spaceibleAsset.balanceOf(buyer.address, asset.id)
			buyerMoneyBalanceAfter = await money.balanceOf(buyer.address)

			sellerAssetBalanceAfter = await spaceibleAsset.balanceOf(seller.address, asset.id)
			sellerMoneyBalanceAfter = await money.balanceOf(seller.address)
		})

		const expected = {
			sellerMoneyBalanceAfter: parseUnits('97', moneyDecimals),
			sellerAssetBalanceAfter: 99,
			buyerAssetBalanceAfter: 1,
			royaltiesAmount: 0,
			platformFeeAmount: parseUnits('3', moneyDecimals)
		}

		it('operator should have correct money balance before', () => expect(operatorMoneyBalanceBefore).to.be.eq(0))
		it('buyer should have correct money balance before', () => expect(buyerMoneyBalanceBefore).to.be.eq(buyPrice))
		it('buyer should have correct asset balance before', () => expect(buyerAssetBalanceBefore).to.be.eq(0))
		it('seller should have correct asset balance before', () => expect(sellerAssetBalanceBefore).to.be.eq(100))
		it('seller should have correct money balance before', () => expect(sellerMoneyBalanceBefore).to.be.eq(0))

		it('operator should have correct money balance after', () =>
			expect(operatorMoneyBalanceAfter).to.be.eq(parseUnits('3', moneyDecimals)))
		it('buyer should have correct money balance after', () => expect(buyerMoneyBalanceAfter).to.be.eq(0))
		it('buyer should have correct asset balance after', () => expect(buyerAssetBalanceAfter).to.be.eq(1))
		it('seller should have correct money balance after', () =>
			expect(sellerMoneyBalanceAfter).to.be.eq(parseUnits('97', moneyDecimals)))
		it('seller should have correct asset balance after', () => expect(sellerAssetBalanceAfter).to.be.eq(99))

		it('should have correct `buy` event data', async () => {
			await expect(buyTx)
				.to.emit(spaceibleOffer, 'Buy')
				.withArgs(
					offer.id,
					buyAmount,
					expected.sellerMoneyBalanceAfter,
					expected.royaltiesAmount,
					expected.platformFeeAmount
				)
		})
	})
})
