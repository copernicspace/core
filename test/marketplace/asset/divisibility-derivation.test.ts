import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import { divisibilityFixtureWithWeight } from './divisibility.fixture'
import { getAssetID } from '../../helpers/new-asset-id.helper'

/*
    General test set for division-oriented operations on divisible tokens
*/

describe('[divisibility-derivation.test.ts]', () => {
	let assetContract: Asset
	let deployer: SignerWithAddress, rootUser: SignerWithAddress, _placeholderUser: SignerWithAddress
	let rootID: BigNumber
	before(
		'load divisibility deploy fixture',
		async () =>
			({ assetContract, deployer, rootUser, rootID } = await waffle.loadFixture(divisibilityFixtureWithWeight))
	)

	let nonRootUser: SignerWithAddress
	before('init signers', async () => ([_placeholderUser, nonRootUser] = await ethers.getSigners()))

	let mintedIDs: BigNumber[]
	it('has correct new root asset ID', async () => expect(rootID).to.be.equal('1'))

	// create child asset
	let childAssetTxr
	before(
		'create new child asset and get ID of new token',
		async () =>
			(childAssetTxr = await assetContract
				.connect(nonRootUser)
				.create(rootID, true, true, 1000)
				.then(tx => tx.wait()))
	)

	let childID: BigNumber
	before('extract new child asset ID from tx receipt event', async () => {
		childID = getAssetID(childAssetTxr)
		expect(childID).to.be.eq('2')
	})

	it('new child asset has correct weight', async () => expect(await assetContract.getWeight(childID)).to.be.eq('1000'))

	it('correctly sets newly created asset parent to the original asset', async () => {
		expect(await assetContract.getParentID(childID)).to.be.eq(rootID)
	})
})
