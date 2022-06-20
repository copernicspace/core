import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleOffer } from './fixtures/deploy.fixture'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import contractNames from '../../../constants/contract.names'
import { ContractReceipt, ContractTransaction } from '@ethersproject/contracts'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/pause] `SpaceibleOffer::pause/unpause/isPaused` test suite', () => {
	let spaceibleAsset: SpaceibleAsset

	let spaceibleOffer: SpaceibleOffer

	let erc20Mock: ERC20Mock
	let deployer: SignerWithAddress, seller: SignerWithAddress, user: SignerWithAddress

	let mintTx: ContractTransaction
	let mintTxr: ContractReceipt

	let sellTx: ContractTransaction
	let sellTxr: ContractReceipt

	let pauseTx: ContractTransaction

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

	before('load creator and user', async () => ([, seller, user] = await ethers.getSigners()))

	const asset = {
		id: undefined,
		cid: 'mockCID-deployer-0x123abc',
		balance: 100,
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
		amount: 100,
		price: 100
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

	before('send pause tx from seller', async () => (pauseTx = await spaceibleOffer.connect(seller).pause(offer.id)))

	describe('access to `pause` function', () => {
		it('should revert on `pause` tx if user is not offer seller', async () =>
			await expect(spaceibleOffer.connect(user).pause(offer.id)).to.be.revertedWith(
				'Only offer seller can pause'
			))

		it('should not revert on `pause` tx if user is seller', async () =>
			await expect(spaceibleOffer.connect(seller).pause(offer.id)).not.to.be.reverted)
	})

	describe('`paused` state for offer after `pause` tx', () => {
		it('should set paused status after tx', async () =>
			await expect(pauseTx).to.emit(spaceibleOffer, 'Pause').withArgs(offer.id))

		it('should have paused status after pause tx', async () =>
			expect(await spaceibleOffer.isPaused(offer.id)).to.be.true)
	})

	describe('access to `unpause` function', () => {
		it('should revert on `unpause` tx if user is not offer seller', async () =>
			await expect(spaceibleOffer.connect(user).unpause(offer.id)).to.be.revertedWith(
				'Only offer seller can unpause'
			))

		it('should not revert on `unpause` tx if user is offer seller', async () =>
			await expect(spaceibleOffer.connect(seller).unpause(offer.id)).not.to.be.reverted)
	})

	describe('`unpause` state for offer offer after `unpause` tx`', async () => {
		before('pause offer first', async () => await spaceibleOffer.connect(seller).pause(offer.id))

		it('offer is paused before', async () => expect(await spaceibleOffer.isPaused(offer.id)).to.be.true)

		it('should unpause offer', async () =>
			await expect(spaceibleOffer.connect(seller).unpause(offer.id))
				.to.emit(spaceibleOffer, 'Unpause')
				.withArgs(offer.id))

		it('offer should be unpause after', async () => expect(await spaceibleOffer.isPaused(offer.id)).to.be.false)
	})
})
