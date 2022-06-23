import { BigNumber } from '@ethersproject/bignumber'
import { ContractReceipt, ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

let spaceibleAsset: SpaceibleAsset
let spaceibleOffer: SpaceibleOffer

let deployer: SignerWithAddress, seller: SignerWithAddress

let mintTx: ContractTransaction
let mintTxr: ContractReceipt

let sellTx: ContractTransaction
let sellTxr: ContractReceipt

let erc20Mock: ERC20Mock
describe('[spaceibles/offer/sell]', () => {
	before(
		'load offer/fixtures/deploy',
		async () => ({ deployer, spaceibleAsset, spaceibleOffer } = await loadFixture(deploySpaceibleOffer))
	)

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
		balance: 142,
		royalties: 0,
		data: '0x'
	}

	before(
		'grant creator role to user',
		async () => await spaceibleAsset.connect(deployer).grantCreatorRole(seller.address)
	)

	before('mint asset as seller and assign id', async () => {
		mintTx = await spaceibleAsset.connect(seller).mint(asset.cid, asset.balance, asset.royalties, asset.data)
		mintTxr = await mintTx.wait()
	})

	before('assign asset id from mint tx receipt', async () => (asset.id = getAssetID(mintTxr)))

		const offer = {
			id: undefined,
			amount: 132,
			price: 1000
		}

	before(
		'approve for all as seller',
		async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
	)

	before('create new offer', async () => {
		sellTx = await spaceibleOffer.connect(seller).sell(asset.id, offer.amount, offer.price, erc20Mock.address)

		sellTxr = await sellTx.wait()
	})

	before('assign new sell offer id', async () => (offer.id = getOfferId(sellTxr)))

	describe('correct data for new offer', () => {
		let newOffer: {
			seller: string
			assetId: BigNumber
			amount: BigNumber
			price: BigNumber
			money: string
		}

		before('read new offer`s data from chain', async () => (newOffer = await spaceibleOffer.getOffer(offer.id)))

		it('should have correct `id` value', async () => expect(offer.id).to.be.eq(1))
		it('should have correct `seller` value', async () => expect(newOffer.seller).to.be.eq(seller.address))
		it('should have correct `assetId` value', async () => expect(newOffer.assetId).to.be.eq(asset.id))
		it('should have correct `amount` value', async () => expect(newOffer.amount).to.be.eq(offer.amount))
		it('should have correct `price` value', async () => expect(newOffer.price).to.be.eq(offer.price))
		it('should have correct `price` value', async () => expect(newOffer.money).to.be.eq(erc20Mock.address))
	})

	describe('correct `NewOffer` event data', () =>
		it('should have correct `id` value', async () =>
			await expect(sellTx).to.emit(spaceibleOffer, 'NewOffer').withArgs(offer.id)))

	describe('offer creation: insufficient balance revert', async () => {
		// current amount across offers: 132 --> amount available: 10 --> should revert
		it('reverts sell if insufficient available balance', async() =>
			await expect(spaceibleOffer.connect(seller).sell(asset.id, 11, offer.price, erc20Mock.address)).to.be.revertedWith('Asset amount accross offers exceeds balance'))
		
		// should succeed if amount sold within amount available (10)
		it('does not revert if total amount within user balance', async() => {
			const tx = await (await spaceibleOffer.connect(seller).sell(asset.id, 10, offer.price, erc20Mock.address)).wait()
			expect(tx.status).to.be.eq(1)
		})
	})
})
