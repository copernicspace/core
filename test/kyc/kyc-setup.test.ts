import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import contractNames from '../../constants/contract.names'

describe('SpaceCargoAsset: KYC instantiation during root creation', () => {
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

	it('disallows _setupKyc() after finalized', async () => {
		await expect(cargoContract.connect(deployer)._setupKyc(kycContract.address)).to.be.revertedWith(
			'Kyc: contract is already finalized'
		)
	})

	it('disallows _setupKyc() with another kyc contract after finalized', async () => {
		const kycContract2 = await ethers
			.getContractFactory(contractNames.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		expect(kycContract.address).to.not.be.eq(kycContract2.address)

		await expect(cargoContract.connect(deployer)._setupKyc(kycContract2.address)).to.be.revertedWith(
			'Kyc: contract is already finalized'
		)
	})
})
