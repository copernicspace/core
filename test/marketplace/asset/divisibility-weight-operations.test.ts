import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import { divisibilityFixtureWithWeight } from './divisibility.fixture'

/*
    General test set for weight-oriented operations on divisible tokens
*/

describe('[divisibility-weight-operations.test.ts]', () => {
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

	it('has correct new root asset ID', async () => expect(rootID).to.be.equal('1'))

	it('has correct weight', async () => expect(await assetContract.getWeight(rootID)).to.be.eq('5000'))

	it('allows owners to set new weight of asset', async () => {
		await assetContract.connect(rootUser).setWeight(rootID, 200)
		expect(await assetContract.getWeight(rootID)).to.be.eq('200')
	})

	it('disallows non-owners to set weight of asset', async () => {
		await expect(assetContract.connect(nonRootUser).setWeight(rootID, 100)).to.be.revertedWith('Not owner')
	})
})
