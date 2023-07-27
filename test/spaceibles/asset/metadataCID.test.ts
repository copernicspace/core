import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { SpaceibleAsset } from '../../../typechain'

let user: SignerWithAddress
let spaceibleAsset: SpaceibleAsset

describe('[spaceibles/asset/metadataCID]', () => {
	before('load fixture/deploy', async () => ({ spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset)))

	before('load user signer', async () => ([, user] = await ethers.getSigners()))

	describe('assert default value of `metadataCID after deploy', () =>
		it('should have empty string as default value', async () =>
			expect(await spaceibleAsset.contractURI()).to.be.eq('')))

	const newMetadataCID = 'NEW_CID_TEST'

	describe('assert access to setter of `metadataCID`', () =>
		it('should revert on set tx from non admin', async () =>
			await expect(spaceibleAsset.connect(user).setMetadataCID(newMetadataCID)).to.be.revertedWith(
				'Only admin can perform this action'
			)))

	describe('assert setter tx result for `matadataCID`', () => {
		it('should set `metadataCID`', async () =>
			await expect(spaceibleAsset.setMetadataCID(newMetadataCID)).not.to.be.reverted)

		it('should have correct value set tx', async () =>
			expect(await spaceibleAsset.contractURI()).to.be.eq(newMetadataCID))
	})
})
