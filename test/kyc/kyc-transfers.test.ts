import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import { parseUnits } from 'ethers/lib/utils'

describe('SpaceCargoAsset: KYC revert on transfer testing', () => {
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

	it('disallows sending balance to non-KYC users', async () => {
		await expect(
			cargoContract.connect(deployer).send(userA.address, 0, parseUnits('100', await cargoContract.decimals()))
		).to.be.revertedWith('user not on KYC list')
	})

	it('disallows sending balance from non-KYC users', async () => {
		// add permissions to userA
		await kycContract.connect(deployer).setKycStatus(userA.address, true)

		// transfer funds to userA
		await cargoContract.connect(creator).send(userA.address, 0, parseUnits('100', await cargoContract.decimals()))

		// remove permissions from userA
		await kycContract.connect(deployer).setKycStatus(userA.address, false)

		// try sending from userA to creator
		await expect(
			cargoContract.connect(userA).send(creator.address, 0, parseUnits('100', await cargoContract.decimals()))
		).to.be.revertedWith('user not on KYC list')
	})
})
