import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { SpaceibleAsset } from '../../../typechain'
import { BigNumber } from 'ethers'
import { getAssetID } from '../../helpers/getAssetId.helper'

describe('[spaceibles/asset/burn]', () => {
	let deployer: SignerWithAddress, user: SignerWithAddress, anotherUser: SignerWithAddress
	let spaceibleAsset: SpaceibleAsset
	let userBalanceBefore: BigNumber

	before('load signers', async () => ([, user, anotherUser] = await ethers.getSigners()))

	before(
		'load fixtures/deploy for spaceible asset',
		async () => ({ deployer, spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset))
	)

	before('toggle open create', async () => await spaceibleAsset.connect(deployer).toggleOpenCreate())

	const asset = {
		cid: 'mockCID-0x123abc',
		balance: 100,
		royalties: 0,
		data: '0x',
		id: undefined
	}

	describe('burn whole balance', async () => {
		before(
			'mint new asset',
			async () =>
				await spaceibleAsset
					.connect(user)
					.mint(asset.cid, asset.balance, asset.royalties, asset.data)
					.then(tx => tx.wait())
					.then(txr => (asset.id = getAssetID(txr)))
		)

		before('safe user balance before burn', async () => {
			userBalanceBefore = await spaceibleAsset.balanceOf(user.address, asset.id)
		})

		before(
			'send `burn` transaction for whole amount',
			async () => await spaceibleAsset.connect(user).burn(asset.id, asset.balance)
		)

		it('should have correct `user` balance before burn tx', async () =>
			expect(userBalanceBefore).to.be.eq(asset.balance))

		it('should have zero balance of user after `burn` tx', async () =>
			expect(await spaceibleAsset.balanceOf(user.address, asset.id)).to.be.eq(0))
	})

	describe('burn portion of balance', async () => {
		before(
			'mint new asset',
			async () =>
				await spaceibleAsset
					.connect(user)
					.mint(asset.cid, asset.balance, asset.royalties, asset.data)
					.then(tx => tx.wait())
					.then(txr => (asset.id = getAssetID(txr)))
		)

		before('safe user balances before transfer tx', async () => {
			userBalanceBefore = await spaceibleAsset.balanceOf(user.address, asset.id)
		})

		before(
			'send `burn` transaction',
			async () => await spaceibleAsset.connect(user).burn(asset.id, asset.balance / 2)
		)

		it('should have correct `user` balance before burn tx', async () =>
			expect(userBalanceBefore).to.be.eq(asset.balance))

		it('should have correct balance of user after `burn` tx', async () =>
			expect(await spaceibleAsset.balanceOf(user.address, asset.id)).to.be.eq(asset.balance / 2))
	})

	describe('burn access', async () => {
		before(
			'mint new asset',
			async () =>
				await spaceibleAsset
					.connect(user)
					.mint(asset.cid, asset.balance, asset.royalties, asset.data)
					.then(tx => tx.wait())
					.then(txr => (asset.id = getAssetID(txr)))
		)

		it('should revert on burn from not asset owner', async () =>
			await expect(spaceibleAsset.connect(anotherUser).burn(asset.id, asset.balance)).to.be.revertedWith(
				'ERC1155: burn amount exceeds balance'
			))
	})

	describe('burn asset after transfer', () => {
		before(
			'mint new asset',
			async () =>
				await spaceibleAsset
					.connect(user)
					.mint(asset.cid, asset.balance, asset.royalties, asset.data)
					.then(tx => tx.wait())
					.then(txr => (asset.id = getAssetID(txr)))
		)

		before(
			'transfer to another user',
			async () =>
				await spaceibleAsset
					.connect(user)
					.safeTransferFrom(user.address, anotherUser.address, asset.id, asset.balance / 2, '0x')
		)

		it('should have correct balance after transfer', async () =>
			expect(await spaceibleAsset.balanceOf(anotherUser.address, asset.id)).to.be.eq(asset.balance / 2))

		it('should burn asset got from transfer', async () =>
			await expect(spaceibleAsset.connect(anotherUser).burn(asset.id, asset.balance / 2)).not.to.be.reverted)

		it('should have correct balance after transfer', async () =>
			expect(await spaceibleAsset.balanceOf(anotherUser.address, asset.id)).to.be.eq(0))
	})
})
