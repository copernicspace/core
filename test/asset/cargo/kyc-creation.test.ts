import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from './fixtures/parentable.fixture'
import * as std_ops from '../../helpers/standardOperations'

describe('[test/asset/cargo/kyc-creation.test] SpaceCargo asset: kyc & asset creation', () => {
	/**
	 * Test suite for checking integration of Kyc with root/child asset creation process
	 * Focus on asset creation permissions
	 */
	let userA, userB, userC, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB, userC] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	let cargoContractDecimals: BigNumber
	before(
		'load fixtures/deploy',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	before('get decimals', async () => {
		cargoContractDecimals = await cargoContract.decimals()
	})

	// ===== Child asset creation =====

	const amount: BigNumber = parseUnits('500', cargoContractDecimals)
	it('allows creating child if user on KYC list', async () => {
		// grant KYC permissions
		await std_ops.kyc_add(kycContract, deployer, creator)

		// create child to receiver
		const childID = await std_ops.childCreation(cargoContract, creator, amount, 0, 'childName', creator)

		// check balance of receiver (here: creator)
		await std_ops.checkBal(cargoContract, creator, childID, amount)
	})

	it('disallows creating child if user not on KYC list', async () => {
		// remove KYC permissions
		await std_ops.kyc_remove(kycContract, deployer, creator)

		await expect(
			cargoContract.connect(creator).createChild(amount, 0, 'c-name', creator.address)
		).to.be.revertedWith('not on KYC list')
	})

	// ===== Cargo contract creation =====

	let newCargoContract: CargoAsset
	before('create new root cargo contract', async () => {
		newCargoContract = await std_ops.cargoCreation(
			cargoFactory,
			creator,
			'second.test.uri.com',
			'Second rootSpaceCargo',
			cargoContractDecimals,
			parseUnits('2000', cargoContractDecimals),
			kycContract
		)
	})

	it('correctly created new contract', async () => {
		// has correct URI
		const actual_uri = await newCargoContract.uri('2')
		const expected_uri = 'second.test.uri.com'
		expect(expected_uri).to.be.eq(actual_uri)

		// has correct name
		const actual_name = await newCargoContract.getName(0)
		const expected_name = 'Second rootSpaceCargo'
		expect(expected_name).to.be.eq(actual_name)

		// has correct decimals
		const actual_decimals = await newCargoContract.decimals()
		const expected_decimals = BigNumber.from(18)
		expect(expected_decimals).to.be.eq(actual_decimals)

		// has correct supply
		const actual_supply = await newCargoContract.balanceOf(creator.address, 0)
		const expected_supply = parseUnits('2000', 18)
		expect(expected_supply).to.be.eq(actual_supply)
	})

	it('disallows creating new contract if user not on KYC list', async () => {
		// remove userA perms
		await kycContract.connect(deployer).setKycStatus(userA.address, false)

		const amount = parseUnits('2000', cargoContractDecimals)
		// add userA to cargoFactory perms
		await cargoFactory.connect(deployer).addClient(userA.address)

		await expect(
			cargoFactory
				.connect(userA)
				.createCargo('testuri', 'testname', cargoContractDecimals, amount, kycContract.address)
		).to.be.revertedWith('not on KYC list')
	})

	// ===== Creation of child asset based on new cargo contract =====

	let newChildID: BigNumber
	it('correctly created new child asset', async () => {
		// add back KYC permissions and ensure both caller & receiver have KYC perms
		await std_ops.kyc_add(kycContract, deployer, userB)
		await std_ops.kyc_add(kycContract, deployer, creator)

		newChildID = await std_ops.childCreation(newCargoContract, creator, amount, 0, 'new-new child', userB)

		// has correct ID
		expect(newChildID).to.be.eq(BigNumber.from(1))

		// added correct child balance to userB
		const actual_child_bal = await newCargoContract.balanceOf(userB.address, newChildID)
		const expected_child_bal = amount
		expect(expected_child_bal).to.be.eq(actual_child_bal)

		// set correct root balance of creator
		const actual_root_bal = await newCargoContract.balanceOf(creator.address, 0)
		const expected_root_bal = parseUnits('1500', cargoContractDecimals)
		expect(expected_root_bal).to.be.eq(actual_root_bal)
	})

	it('disallows creating new child if user not on KYC list', async () => {
		// remove KYC permissions
		await std_ops.kyc_remove(kycContract, deployer, creator)

		await expect(
			newCargoContract.connect(creator).createChild(amount, 0, 'newChildSpaceCargoName', creator.address)
		).to.be.revertedWith('not on KYC list')
	})

	// ===== Kyc initialize testing =====

	it('overwrites old kyc with correct kyc during creation', async () => {
		// add back KYC permissions
		await std_ops.kyc_add(kycContract, deployer, creator)

		// create a kyc contract & deploy with deployer
		const old_kycContract = await std_ops.kycInstantiation(deployer)

		// make changes before initialize
		await std_ops.kyc_add(old_kycContract, deployer, userC)

		// create a new asset with correct kyc
		const _newCargoContract = await std_ops.cargoCreation(
			cargoFactory,
			creator,
			'second.test.uri.com',
			'Second rootSpaceCargo',
			cargoContractDecimals,
			parseUnits('2000', cargoContractDecimals),
			kycContract
		)

		// user C not on correct KYC - should be reverted
		await expect(
			_newCargoContract.connect(creator).send(userC.address, 0, parseUnits('100', cargoContractDecimals))
		).to.be.revertedWith('user not on KYC list')

		// userC can be added to KYC by current admin (deployer)
		await std_ops.kyc_add(kycContract, deployer, userC)

		// userC can now be sent transfers
		await expect(
			_newCargoContract.connect(creator).send(userC.address, 0, parseUnits('100', cargoContractDecimals))
		).to.not.be.revertedWith('user not on KYC list')
	})
})
