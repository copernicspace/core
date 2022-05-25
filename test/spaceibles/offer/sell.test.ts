import { BigNumber } from '@ethersproject/bignumber'
import { ContractReceipt, ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { deploySpaceibleAsset } from '../asset/fixtures/deploy.fixture'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/sell]', () => {
	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer

	let seller: SignerWithAddress

	let mintTx: ContractTransaction
	let mintTxr: ContractReceipt

	let sellTx: ContractTransaction
	let sellTxr: ContractReceipt

	let erc20Mock: ERC20Mock

	describe('create new offer', () => {
		before('load asset/fixtures/deploy', async () => ({ spaceibleAsset } = await loadFixture(deploySpaceibleAsset)))

		before('load offer/fixtures/deploy', async () => ({ spaceibleOffer } = await loadFixture(deploySpaceibleOffer)))

		before('deploy ERC20 Mock', async () => {
			erc20Mock = await ethers
				.getContractFactory(contractNames.ERC20_MOCK)
				.then(factory => factory.deploy())
				.then(contract => contract.deployed())
				.then(deployedContract => deployedContract as ERC20Mock)
		})
		before('load seller', async () => ([, seller] = await ethers.getSigners()))

		const asset = {
			id: undefined,
			cid: 'mockCID-deployer-0x123abc',
			balance: 100,
			royalties: 0,
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
			price: 100
		}

		before(
			'approve for all as seller',
			async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
		)

		before('create new offer', async () => {
			sellTx = await spaceibleOffer
				.connect(seller)
				.sell(spaceibleAsset.address, asset.id, offer.amount, offer.price, erc20Mock.address)

			sellTxr = await sellTx.wait()
		})

		before('assign new sell offer id', async () => (offer.id = getOfferId(sellTxr)))

		let newOffer: {
			seller: string
			assetAddress: string
			assetId: BigNumber
			amount: BigNumber
			price: BigNumber
			money: string
		}
		before(
			'read new offer`s data from chain',
			async () => (newOffer = await spaceibleOffer.getSmartOffer(offer.id))
		)

		it('should have correct `id` value', async () => expect(offer.id).to.be.eq(1))
		it('should have correct `seller` value', async () => expect(newOffer.seller).to.be.eq(seller.address))
		it('should have correct `assetAddress` value', async () =>
			expect(newOffer.assetAddress).to.be.eq(spaceibleAsset.address))
		it('should have correct `assetId` value', async () => expect(newOffer.assetId).to.be.eq(asset.id))
		it('should have correct `amount` value', async () => expect(newOffer.amount).to.be.eq(offer.amount))
		it('should have correct `price` value', async () => expect(newOffer.price).to.be.eq(offer.price))
		it('should have correct `price` value', async () => expect(newOffer.money).to.be.eq(erc20Mock.address))
	})
})