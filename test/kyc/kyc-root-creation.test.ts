import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import * as std_ops from '../helpers/standardOperations'

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
	before('create root cargo contract [with starting KYC]', async () => {
		cargoContractA = await std_ops.create
			.from(creator)
			.root('first.test.uri.com', 'First rootSpaceCargo', parseUnits('2000', cargoContractDecimals))
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
	let cargoContractB: CargoAsset
	before('create root cargo contract [with new KYC]', async () => {
		// create a new instance of KYC contact
		secondKYC = await std_ops.kyc.from(deployer).instantiate()

		// give factory permissions
		await cargoFactory.connect(deployer).addClient(userA.address)

		// add userA to secondKYC permissions
		await std_ops.kyc.chooseKyc(secondKYC).from(deployer).add(userA)

		// when creating a new contract, specify override KYC
		cargoContractB = await std_ops.create
			.from(userA)
			.useKyc(secondKYC)
			.root('second.test.uri.com', 'Second rootSpaceCargo', parseUnits('2000', cargoContractDecimals))
	})

	it('connected correct [second] KYC Register', async () => {
		const actualKycRegister = await cargoContractB.kycRegister()
		expect(actualKycRegister).to.be.eq(secondKYC.address)
		expect(actualKycRegister).to.not.be.eq(kycContract)
	})

	/**
	 *      4.
	 *      Check if root asset creation is reverted
	 *      if caller does not have KYC permissions
	 */

	it('disallows creating root cargo if not KYC permitted', async () => {
		// userA does not have KYC permissions on starting KYC
		await expect(
			std_ops.create
				.from(userA)
				.root('revert.test.uri.com', 'Revert rootSpaceCargo', parseUnits('2000', cargoContractDecimals))
		).to.be.revertedWith('user not on KYC list')

		// creator does not kave KYC permissions on secondKYC
		await expect(
			std_ops.create
				.from(creator)
				.useKyc(secondKYC)
				.root('revert.test.uri.com', 'Revert rootSpaceCargo', parseUnits('2000', cargoContractDecimals))
		).to.be.revertedWith('user not on KYC list')
	})
})
