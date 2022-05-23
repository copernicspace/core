import { waffle } from 'hardhat'
import { expect } from 'chai'
import { KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { parentable } from '../spacemart/payload/fixtures/parentable.fixture'

describe.skip('SpacePayloadAsset: KYC default values', () => {
	/**
	 * Test suite for checking KycRegister permission change process
	 */
	let kycContract: KycRegister

	before('load fixtures/deploy`', async () => ({ kycContract } = await waffle.loadFixture(parentable)))

	it('defaults kyc status of an account to false', async () => {
		const [, , , , , account] = await ethers.getSigners()
		const actual = await kycContract.getKycStatusInfo(account.address)
		expect(actual).to.be.false
	})

	it('defaults operator status of an account to false', async () => {
		const [, , , , , , account] = await ethers.getSigners()
		const actual = await kycContract.getOperatorStatusInfo(account.address)
		expect(actual).to.be.false
	})
})
