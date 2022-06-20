import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { SpaceibleAsset } from '../../../typechain'

let deployer: SignerWithAddress
let user: SignerWithAddress
let anotherUser: SignerWithAddress
let spaceibleAsset: SpaceibleAsset

describe('[spaceibles/asset/access]', () => {
	before(
		'load fixture/deploy',
		async () => ({ deployer, spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset))
	)

	before('load user signer', async () => ([, user, anotherUser] = await ethers.getSigners()))

	const asset = {
		cid: 'mockCID-0x123abc',
		balance: 1,
		royalties: 0,
		data: '0x'
	}

	describe('access assert from user w/o creator role', async () => {
		it('should revert on mint from user who has no creator role', async () => {
			await expect(
				spaceibleAsset.connect(user).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			).to.be.revertedWith('You are not allowed to create new Spaceible Asset')
		})
	})

	describe('default roles check', () => {
		it('should be no creator role on user address', async () => {
			const actual = await spaceibleAsset
				.CREATOR_ROLE()
				.then(creatorRole => spaceibleAsset.hasRole(creatorRole, user.address))

			expect(actual).to.be.false
		})
	})

	describe('assert creator role grant access', () => {
		it('should revert on grant role from not admin', async () =>
			await expect(spaceibleAsset.connect(anotherUser).grantCreatorRole(user.address)).to.be.revertedWith(
				'Only admin can perform this action'
			))

		it('should set creator role to user', async () => {
			await spaceibleAsset.connect(deployer).grantCreatorRole(user.address)
			const actual = await spaceibleAsset
				.CREATOR_ROLE()
				.then(creatorRole => spaceibleAsset.hasRole(creatorRole, user.address))

			expect(actual).to.be.true
		})
	})

	describe('assert mint access from user with creator role', () => {
		it('should not revert on mint tx', async () =>
			await expect(spaceibleAsset.connect(user).mint(asset.cid, asset.balance, asset.royalties, asset.data)).not
				.to.be.reverted)
	})
})
