import { waffle } from 'hardhat'
import { expect } from 'chai'
import { KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../spacemart/assets/payload/fixtures/parentable.fixture'

describe.skip('SpacePayloadAsset: KYC instantiation during root creation', () => {
	/**
	 * Test suite for checking KycRegister permission change process
	 */
	let userA, userB, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB] = await ethers.getSigners()))

	let kycContract: KycRegister
	let deployer: SignerWithAddress

	before(
		'load fixtures/deploy`',
		async () => ({ creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	it('disallows non-operators from setting KYC status', async () => {
		await expect(kycContract.connect(creator).setKycStatus(userB.address, true)).to.be.revertedWith(
			'unauthorized -- only for operators & admin'
		)
	})

	it('disallows non-admin from adding new operators', async () => {
		await expect(kycContract.connect(creator).setOperatorStatus(userA.address, true)).to.be.revertedWith(
			'unauthorized -- only for admin'
		)
	})

	it('correctly adds new operators from admin address', async () => {
		const start_status = await kycContract.getOperatorStatusInfo(userB.address)
		expect(await kycContract.connect(deployer).setOperatorStatus(userB.address, true))
		const end_status = await kycContract.getOperatorStatusInfo(userB.address)

		expect(start_status).to.be.false
		expect(end_status).to.be.true
	})

	it('correctly changes admin address', async () => {
		const start_status = await kycContract.currentAdmin()
		expect(await kycContract.connect(deployer).changeAdmin(userB.address))
		const end_status = await kycContract.currentAdmin()

		expect(start_status).to.be.eq(deployer.address)
		expect(end_status).to.be.eq(userB.address)

		await expect(kycContract.connect(deployer).setOperatorStatus(userA.address, true)).to.be.revertedWith(
			'unauthorized -- only for admin'
		)
	})
})
