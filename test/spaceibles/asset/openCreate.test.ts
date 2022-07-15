import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { SpaceibleAsset } from '../../../typechain'

let deployer: SignerWithAddress
let user: SignerWithAddress
let anotherUser: SignerWithAddress
let spaceibleAsset: SpaceibleAsset

describe('[spaceibles/asset/openCreate]', () => {
	before(
		'load fixture/deploy',
		async () => ({ deployer, spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset))
	)

	before('load user signer', async () => ([, user, anotherUser] = await ethers.getSigners()))

	describe('assert default deploy values of open creator state', () => {
		it('should have default state eq to `false` ', async () =>
			expect(await spaceibleAsset.openCreate()).to.be.false)

		it('should return false for user address by default', async () =>
			expect(await spaceibleAsset.hasCreatorRole(user.address)).to.be.false)

		it('should return false for another user address by default', async () =>
			expect(await spaceibleAsset.hasCreatorRole(anotherUser.address)).to.be.false)

		it('should return true for deployer/admin address by default', async () =>
			expect(await spaceibleAsset.hasCreatorRole(deployer.address)).to.be.true)
	})

	const asset = {
		cid: 'mockCID-0x123abc',
		balance: 1,
		royalties: 0,
		data: '0x'
	}

	describe('access to mint function on default deploy', () => {
		it('should revert on mint tx from user', async () =>
			await expect(
				spaceibleAsset.connect(user).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			).to.be.revertedWith('You are not allowed to create new Spaceible Asset'))

		it('should revert on mint tx from another user', async () =>
			await expect(
				spaceibleAsset.connect(anotherUser).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			).to.be.revertedWith('You are not allowed to create new Spaceible Asset'))

		it('should not revert on mint tx from user', async () =>
			await expect(
				spaceibleAsset.connect(deployer).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			).not.to.be.revertedWith('You are not allowed to create new Spaceible Asset'))
	})

	describe('access to `toggleOpenCreate', () => {
		it('should revert on tx from non admin', async () =>
			await expect(spaceibleAsset.connect(user).toggleOpenCreate()).to.be.revertedWith(
				'Only admin can perform this action'
			))

		it('should not revert on tx from admin', async () =>
			await expect(spaceibleAsset.connect(deployer).toggleOpenCreate()).not.to.be.revertedWith(
				'Only admin can perform this action'
			))

		it('should have `true` value of `openCreate` after toggle tx', async () =>
			expect(await spaceibleAsset.openCreate()).to.be.true)
	})

	describe('access to mint function after `toggleOpenCreate`', () => {
		it('should not revert on mint tx from user', async () =>
			await expect(spaceibleAsset.connect(user).mint(asset.cid, asset.balance, asset.royalties, asset.data)).not
				.to.be.reverted)

		it('should not revert on mint tx from another user', async () =>
			await expect(
				spaceibleAsset.connect(anotherUser).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			).not.to.be.reverted)
	})

	describe('toggle open create to false', () => {
		it('should not revert on toggle tx', async () =>
			await expect(spaceibleAsset.connect(deployer).toggleOpenCreate()).not.to.be.reverted)

		it('should have `false` value for openCreate state after second toggle', async () =>
			expect(await spaceibleAsset.openCreate()).to.be.false)
	})
})
