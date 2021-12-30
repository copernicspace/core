import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from './fixtures/parentable.fixture'
import contractNames from '../../../constants/contract.names'
import { getCargoAddress } from '../../helpers/cargoAddress'
import contract_names from '../../../constants/contract.names'

describe('[test/asset/cargo/kyc-miscellaneous.test] SpaceCargo asset: kyc miscellaneous', () => {
	/**
	 * Test suite for checking KycRegister permission change process
	 */
	let userA, userB, userC, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB, userC] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress

	before(
		'load fixtures/deploy`',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	it('correctly set creator KYC permissions in fixture', async () => {
		const expected = await kycContract.getKycStatusInfo(creator.address)
		expect(expected).to.be.true
	})

	// ===== Kyc setup process restrictions =====

	it('disallows _setupKyc() after finalized', async () => {
		await expect(cargoContract.connect(deployer)._setupKyc(kycContract.address)).to.be.revertedWith(
			'Kyc: contract is already finalized'
		)
	})

	it('disallows _setupKyc() with another kyc contract after finalized', async () => {
		const kycContract2 = await ethers
			.getContractFactory(contract_names.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		expect(kycContract.address).to.not.be.eq(kycContract2.address)

		await expect(cargoContract.connect(deployer)._setupKyc(kycContract2.address)).to.be.revertedWith(
			'Kyc: contract is already finalized'
		)
	})

	// ===== Kyc status, Operator status, Admin address =====

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

	// ===== Kyc integration with transfer restrictions =====

	it('disallows sending balance to & from non-kyc users', async () => {
		await kycContract.connect(userB).setKycStatus(userB.address, false)
		// send to userB
		await expect(cargoContract.connect(creator).send(userA.address, 0, 100)).to.be.revertedWith('not on KYC list')
		// send from user B
		await expect(cargoContract.connect(userB).send(creator.address, 0, 100)).to.be.revertedWith('not on KYC list')
	})

	// ===== Default kyc values =====

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
