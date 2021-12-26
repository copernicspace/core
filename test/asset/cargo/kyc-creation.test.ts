import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { parseUnits } from '@ethersproject/units'
import { parentable } from './fixtures/parentable.fixture'
import contractNames from '../../../constants/contract.names'
import { getCargoAddress } from '../../helpers/cargoAddress'
import contract_names from '../../../constants/contract.names'

describe('[test/asset/cargo/kyc-miscellaneous.test] SpaceCargo asset: kyc & asset creation', () => {
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
		'load fixtures/deploy`',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	before('get decimals', async () => {
		cargoContractDecimals = await cargoContract.decimals()
	})

	// ===== Child asset creation =====

	it('allows creating child if user on KYC list', async () => {
		// grant KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)
		const amount = parseUnits('500', cargoContractDecimals)

		// create child to receiver
		const childID = await cargoContract
			.connect(creator)
			.createChild(amount, 0, 'childSpaceCargoName', creator.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(childID).to.be.eq(BigNumber.from(2))

		const actual = await cargoContract.balanceOf(creator.address, childID)
		const expected = amount
		expect(expected).to.be.eq(actual)
	})

	it('disallows creating child if user not on KYC list', async () => {
		cargoContractDecimals = await cargoContract.decimals()
		const amount = parseUnits('500', cargoContractDecimals)

		// remove KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, false)

		await expect(
			cargoContract.connect(creator).createChild(amount, 0, 'childSpaceCargoName', creator.address)
		).to.be.revertedWith('not on KYC list')
	})

	// ===== Cargo contract creation =====

	let newCargoContractAddress: string
	let newCargoContract: CargoAsset
	let amount: BigNumber

	before('create new root cargo contract', async () => {
		amount = parseUnits('2000', cargoContractDecimals)

		newCargoContractAddress = await cargoFactory
			.connect(creator)
			.createCargo(
				'second.test.uri.com',
				'Second rootSpaceCargo',
				cargoContractDecimals,
				amount,
				kycContract.address
			)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		newCargoContract = await ethers
			.getContractAt(contractNames.CARGO_ASSET, newCargoContractAddress)
			.then(contract => contract as CargoAsset)
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
				.createCargo('userA.cargo.com', 'userA test cargo', cargoContractDecimals, amount, kycContract.address)
		).to.be.revertedWith('not on KYC list')
	})

	// ===== Creation of child asset based on new cargo contract =====

	let newChildID: BigNumber
	let newAmount: BigNumber
	it('correctly created new child asset', async () => {
		await kycContract.connect(deployer).setKycStatus(userB.address, true)

		// add back KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)

		const cargoContractDecimals = await newCargoContract.decimals()
		newAmount = parseUnits('500', cargoContractDecimals)

		// create child to receiver (user B)
		newChildID = await newCargoContract
			.connect(creator)
			.createChild(newAmount, 0, 'new-new child', userB.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		// has correct ID
		expect(newChildID).to.be.eq(BigNumber.from(1))

		// added correct child balance to userB
		const actual_child_bal = await newCargoContract.balanceOf(userB.address, newChildID)
		const expected_child_bal = newAmount
		expect(expected_child_bal).to.be.eq(actual_child_bal)

		// set correct root balance of creator
		const actual_root_bal = await newCargoContract.balanceOf(creator.address, 0)
		const expected_root_bal = parseUnits('1500', cargoContractDecimals)
		expect(expected_root_bal).to.be.eq(actual_root_bal)
	})

	it('disallows creating new child if user not on KYC list', async () => {
		cargoContractDecimals = await newCargoContract.decimals()
		const amount = parseUnits('500', cargoContractDecimals)

		// remove KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, false)

		await expect(
			newCargoContract.connect(creator).createChild(amount, 0, 'newChildSpaceCargoName', creator.address)
		).to.be.revertedWith('not on KYC list')
	})

	// ===== Kyc initialize testing =====

	it('overwrites old kyc with correct kyc during creation', async () => {
		// add back KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)

		// create a kyc contract & deploy with deployer
		const old_kycContract = await ethers
			.getContractFactory(contract_names.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		// make changes before initialize
		await old_kycContract.connect(deployer).setKycStatus(userC.address, true)

		// create a new asset with correct kyc
		amount = parseUnits('2000', cargoContractDecimals)

		const _newCargoContractAddress = await cargoFactory
			.connect(creator)
			.createCargo(
				'second.test.uri.com',
				'Second rootSpaceCargo',
				cargoContractDecimals,
				amount,
				kycContract.address // perviously used KYC
			)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		const _newCargoContract = await ethers
			.getContractAt(contractNames.CARGO_ASSET, _newCargoContractAddress)
			.then(contract => contract as CargoAsset)

		// user C not on correct KYC - should be reverted
		await expect(
			_newCargoContract.connect(creator).send(userC.address, 0, parseUnits('100', cargoContractDecimals))
		).to.be.revertedWith('user not on KYC list')

		// userC can be added to KYC by current admin (deployer)
		await kycContract.connect(deployer).setKycStatus(userC.address, true)

		// userC can now be sent transfers
		await expect(
			_newCargoContract.connect(creator).send(userC.address, 0, parseUnits('100', cargoContractDecimals))
		).to.not.be.revertedWith('user not on KYC list')
	})
})
