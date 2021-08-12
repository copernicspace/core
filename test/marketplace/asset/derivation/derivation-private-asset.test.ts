import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { waffle } from 'hardhat'
import { Asset } from '../../../../typechain'
import { privateSpaceAsset } from '../asset.fixture'
import { ethers } from 'hardhat'
import { BigNumberish } from 'ethers'
import { getAssetID } from '../../../helpers/new-asset-id.helper'

describe('[derivation-private-asset.test.ts] Private asset derivation test suide', () => {
	let assetContract: Asset
	let privateId: BigNumberish
	before(
		'load private space asset waffle fixture',
		async () => ({ assetContract, privateId } = await waffle.loadFixture(privateSpaceAsset))
	)

	let owner: SignerWithAddress, user: SignerWithAddress
	before('init signers from hardhat node', async () => ([, owner, user] = await ethers.getSigners()))

	it('create asset based on private parent, from non-owner', async () => {
		await expect(assetContract.connect(user).create(privateId, false, false, 0)).to.be.revertedWith(
			'Can not create new asset, based on selected as parent'
		)
	})

	let childPrivateId: BigNumberish
	it('create child asset based on private asset, from owner', async () => {
		childPrivateId = await assetContract
			.connect(owner)
			.create(privateId, false, false, 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await assetContract.getParentID(childPrivateId)).to.be.equal(privateId)
	})

	it('create private child based on private child asset, from non-owner', async () => {
		await expect(assetContract.connect(user).create(childPrivateId, false, false, 0)).to.be.revertedWith(
			'Can not create new asset, based on selected as parent'
		)
	})

	it('create private child asset based on private child asset, from owner', async () => {
		const id = await assetContract
			.connect(owner)
			.create(childPrivateId, false, false, 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await assetContract.getParentID(id)).to.be.equal(childPrivateId)
	})

})
