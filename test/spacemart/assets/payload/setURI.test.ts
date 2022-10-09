import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { KycRegister, PayloadAsset } from '../../../../typechain'
import { createPayloadAsset } from './fixtures/create.fixture'

describe('[spacemart/assets/payload/setURI] test suite for `setUri` function', () => {
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister
	let creator: SignerWithAddress
	let deployer: SignerWithAddress
	let user: SignerWithAddress

	before(
		'load fixtures/createPayloadAsset`',
		async () => ({ payloadAsset, deployer, creator, kycContract } = await waffle.loadFixture(createPayloadAsset))
	)

	before('load userA', async () => ([, , user] = await ethers.getSigners()))

	before('add user to KYC', async () => {
		const tx = await kycContract.connect(deployer).setKycStatus(user.address, true)
	})

	it('should revert on non-creator `setURI`', async () =>
		await expect(payloadAsset.connect(user).setUri(0, 'NEW_CID')).to.be.revertedWith(
			'You are not allowed to change URI'
		))

	it('should revert on creator `setURI`', async () =>
		await expect(payloadAsset.connect(creator).setUri(0, 'NEW_CID')).to.be.revertedWith(
			'You are not allowed to change URI'
		))

	it('should not revert on admin `setURI`', async () => {
		const before = await payloadAsset.uri(0)

		await expect(payloadAsset.connect(deployer).setUri(0, 'NEW_CID')).not.to.be.revertedWith(
			'You are not allowed to change URI'
		)

		const after = await payloadAsset.uri(0)
		expect(before).is.not.eq(after)
	})

	it('should create child asset for further test', async () => {
		await expect(
			payloadAsset.connect(creator).createChild('1', '1', 0, 'child-test', user.address, 'child-test-cid', '0')
		).not.to.be.reverted
	})

	it('should revert on `setUri` from creator for child asset', async () =>
		await expect(payloadAsset.connect(creator).setUri(1, 'new-child-test-cid')).to.be.revertedWith(
			'You are not allowed to change URI'
		))

	it('should revert on `setUri` from user for child asset', async () =>
		await expect(payloadAsset.connect(user).setUri(1, 'new-child-test-cid')).to.be.revertedWith(
			'You are not allowed to change URI'
		))

	it('should set uri from admin', async () => {
		const before = await payloadAsset.uri(1)
		await expect(payloadAsset.connect(deployer).setUri(1, 'new-child-test-cid')).not.to.be.reverted
		const after = await payloadAsset.uri(1)
		expect(before).not.eq(after)
	})
})
