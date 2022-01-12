import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'

describe('SpaceCargoAsset: KYC default values', () => {
	/**
	 * Test suite for checking KycRegister permission change process
	 */
	let userA, userB, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress

	before(
		'load fixtures/deploy`',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

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
