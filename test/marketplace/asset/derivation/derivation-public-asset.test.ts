import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { waffle } from 'hardhat'
import { Asset } from '../../../../typechain'
import { publicSpaceAsset } from '../asset.fixture'
import { ethers } from 'hardhat'
import { BigNumberish } from 'ethers'
import { getAssetID } from '../../../helpers/new-asset-id.helper'

describe('[derivation-public-asset.test.ts] Public asset derivation test suide', () => {
	let assetContract: Asset
	let publicId: BigNumberish
	before(
		'load public space asset waffle fixture',
		async () => ({ assetContract, publicId } = await waffle.loadFixture(publicSpaceAsset))
	)

	let owner: SignerWithAddress, user: SignerWithAddress
	before('init signers from hardhat node', async () => ([, owner, user] = await ethers.getSigners()))

	it('create public child asset based on public root asset, from non-owner', async () => {
		const id = await assetContract
			.connect(user)
			.create(publicId, true, false, 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await assetContract.getParentID(id)).to.be.equal(publicId)
	})

	let childPublicId: BigNumberish
	it('create public child asset based on public root asset, from owner', async () => {
		childPublicId = await assetContract
			.connect(owner)
			.create(publicId, true, false, 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await assetContract.getParentID(childPublicId)).to.be.equal(publicId)
	})

	it('create public child asset based on public child asset, from non-owner', async () => {
		const id = await assetContract
			.connect(user)
			.create(childPublicId, true, false, 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await assetContract.getParentID(id)).to.be.equal(childPublicId)
	})

	it('create public child asset based on public child asset, from owner', async () => {
		const id = await assetContract
			.connect(owner)
			.create(childPublicId, true, false, 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await assetContract.getParentID(id)).to.be.equal(childPublicId)
	})
})
