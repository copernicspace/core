import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ContractTransaction } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'
import contractNames from '../../../constants/contract.names'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

let spaceibleAsset: SpaceibleAsset
let spaceibleOffer: SpaceibleOffer
let erc20Mock: ERC20Mock
let anotherErc20Mock: ERC20Mock

let deployer: SignerWithAddress
let seller: SignerWithAddress
let user: SignerWithAddress

let editTx: ContractTransaction

describe('[spaceibles/offer/edit]', () => {
	before(
		'load offer/fixtures/deploy',
		async () => ({ deployer, spaceibleAsset, spaceibleOffer } = await loadFixture(deploySpaceibleOffer))
	)

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

	before('deploy another ERC20 Mock', async () => {
		const name = 'MockToken2'
		const symbol = 'MT2'
		const decimals = 18

		anotherErc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy(name, symbol, decimals))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})
	before('load signers', async () => ([, seller, user] = await ethers.getSigners()))

	const asset = {
		id: undefined,
		cid: 'mockCID-deployer-0x123abc',
		balance: 200,
		royalties: 0,
		data: '0x'
	}

	before(
		'grant creator role to user',
		async () => await spaceibleAsset.connect(deployer).grantCreatorRole(seller.address)
	)

	before('mint asset as seller and assign id', async () => {
		asset.id = await spaceibleAsset
			.connect(seller)
			.mint(asset.cid, asset.balance, asset.royalties, asset.data)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))
	})

	before(
		'approve offer for all asset as seller',
		async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
	)

	const offer = {
		id: undefined,
		amount: 142,
		price: 1000
	}

	before('create new offer', async () => {
		offer.id = await spaceibleOffer
			.connect(seller)
			.sell(asset.id, offer.amount, offer.price, erc20Mock.address)
			.then(tx => tx.wait())
			.then(txr => getOfferId(txr))
	})

	const updatedOffer = {
		amount: 200,
		price: 1050
	}

	describe('edit access', () => {
		it('should revert on edit tx from not offer seller', async () =>
			await expect(
				spaceibleOffer.connect(user).edit(offer.id, updatedOffer.amount, updatedOffer.price, erc20Mock.address)
			).to.be.revertedWith('Only offer creator can edit'))

		it('should not revert on edit from offer seller', async () => {
			editTx = await spaceibleOffer
				.connect(seller)
				.edit(offer.id, updatedOffer.amount, updatedOffer.price, anotherErc20Mock.address)

			await expect(editTx.wait()).not.to.be.reverted
		})

		it('should have correct event data on edit tx', async () =>
			await expect(editTx)
				.to.emit(spaceibleOffer, 'Edit')
				.withArgs(offer.id, updatedOffer.amount, updatedOffer.price, anotherErc20Mock.address))
	})

	describe('updated offer data', () => {
		let offerData: {
			seller: string
			assetId: BigNumber
			amount: BigNumber
			price: BigNumber
			money: string
		}

		before('read new offer`s data from chain', async () => (offerData = await spaceibleOffer.get(offer.id)))

		it('should have correct `id` value', async () => expect(offer.id).to.be.eq(1))
		it('should have correct `seller` value', async () => expect(offerData.seller).to.be.eq(seller.address))
		it('should have correct `assetId` value', async () => expect(offerData.assetId).to.be.eq(asset.id))
		it('should have correct `amount` value', async () => expect(offerData.amount).to.be.eq(updatedOffer.amount))
		it('should have correct `price` value', async () => expect(offerData.price).to.be.eq(updatedOffer.price))
		it('should have correct `money` value', async () => expect(offerData.money).to.be.eq(anotherErc20Mock.address))
	})
})
