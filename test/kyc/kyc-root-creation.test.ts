import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import contract_names from '../../constants/contract.names'
import { getCargoAddress } from '../helpers/cargoAddress'
import contractNames from '../../constants/contract.names'

describe('SpaceCargoAsset: Root creation & integration with KYC', () => {
	let userA, userB, userC, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB, userC] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	let cargoContractDecimals: BigNumber

	before(
		'load fixtures/parentable',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	before('get decimals', async () => {
		cargoContractDecimals = await cargoContract.decimals()
	})

	/**
	 *      1.
	 *      Check if a newly created root asset is related to the same KYC contract
	 *      as the cargo created in fixtures
	 */

	let cargoContractA: CargoAsset
	let cargoContractAaddress
	before('create root cargo contract [with starting KYC]', async () => {
		cargoContractAaddress = await cargoFactory
			.connect(creator)
			.createCargo(
				'first.test.uri.com',
				'First rootSpaceCargo',
				cargoContractDecimals,
				parseUnits('2000', cargoContractDecimals),
				kycContract.address
			)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		cargoContractA = await ethers
			.getContractAt(contractNames.CARGO_ASSET, cargoContractAaddress)
			.then(contract => contract as CargoAsset)
	})

	it('connected correct [first] KYC Register', async () => {
		const actualKycRegister = await cargoContractA.kycRegister()
		expect(actualKycRegister).to.be.eq(kycContract.address)
	})

	/**
	 *      2.
	 *      Check if can create a new instance of KYC Register
	 *      and use it in creation of another root asset
	 */

	let secondKYC: KycRegister
	let cargoContractBaddress
	let cargoContractB: CargoAsset
	before('create root cargo contract [with new KYC]', async () => {
		// create a new instance of KYC contact
		secondKYC = await ethers
			.getContractFactory(contract_names.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		// give factory permissions
		await cargoFactory.connect(deployer).addClient(userA.address)

		// add userA to secondKYC permissions
		await secondKYC.connect(deployer).setKycStatus(userA.address, true)

		// when creating a new contract, specify override KYC
		cargoContractBaddress = await cargoFactory
			.connect(userA)
			.createCargo(
				'second.test.uri.com',
				'Second rootSpaceCargo',
				cargoContractDecimals,
				parseUnits('2000', cargoContractDecimals),
				secondKYC.address
			)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		cargoContractB = await ethers
			.getContractAt(contractNames.CARGO_ASSET, cargoContractBaddress)
			.then(contract => contract as CargoAsset)
	})

	it('connected correct [second] KYC Register', async () => {
		const actualKycRegister = await cargoContractB.kycRegister()
		expect(actualKycRegister).to.be.eq(secondKYC.address)
		expect(actualKycRegister).to.not.be.eq(kycContract)
	})

	/**
	 *      3.
	 *      Check if root asset creation is reverted
	 *      if caller does not have KYC permissions
	 */

	it('disallows creating root cargo if not KYC permitted', async () => {
		// userA does not have KYC permissions on starting KYC
		await expect(
			cargoFactory
				.connect(userA)
				.createCargo(
					'revert.test.uri.com',
					'Revert rootSpaceCargo',
					cargoContractDecimals,
					parseUnits('2000', cargoContractDecimals),
					kycContract.address
				)
		).to.be.revertedWith('user not on KYC list')

		// creator does not kave KYC permissions on secondKYC
		await expect(
			cargoFactory
				.connect(creator)
				.createCargo(
					'revert.test.uri.com',
					'Revert rootSpaceCargo',
					cargoContractDecimals,
					parseUnits('2000', cargoContractDecimals),
					secondKYC.address
				)
		).to.be.revertedWith('user not on KYC list')
	})
})
