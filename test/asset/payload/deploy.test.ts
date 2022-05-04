import { waffle } from 'hardhat'
import { expect } from 'chai'
import { PayloadFactory, KycRegister } from '../../../typechain'
import { deployPayloadAsset } from './fixtures/deploy.fixture'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[test/asset/payload/deploy.test] PayloadFactory for asset: deploy fixture test suite', () => {
	let user: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , user] = await ethers.getSigners()))

	let payloadFactory: PayloadFactory
	let kycContract: KycRegister
	before(
		'load fixtures/deploy`',
		async () => ({ payloadFactory, kycContract } = await waffle.loadFixture(deployPayloadAsset))
	)

	it('has success tx receipt status', async () =>
		await payloadFactory.deployTransaction
			.wait()
			.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	it('reverts on `createPayload`, if user is not a factory client', async () =>
		await expect(
			payloadFactory
				.connect(user)
				.create('test.uri.com', 'TestSpacePayloadName', 18, '3500', kycContract.address, 0, false)
		).to.be.revertedWith('You are not allowed to create new SpaceAsset:Payload'))

	it('reverts if addClient called from non manager', async () => {
		await expect(payloadFactory.connect(user).addClient(user.address)).to.be.revertedWith(
			'Only factory owner & managers can add clients'
		)
	})
})
