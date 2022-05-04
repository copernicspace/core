import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from '@ethersproject/units'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { KycRegister, PayloadAsset, PayloadFactory } from '../../typechain'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import contract_names from '../../constants/contract.names'
import { getPayloadAddress } from '../helpers/cargoAddress'
import contractNames from '../../constants/contract.names'

describe('[test/kyc/kyc-root-creation.test] Root creation & integration with KYC', () => {
	let userA: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA] = await ethers.getSigners()))

	let payloadFactory: PayloadFactory
	let creator: SignerWithAddress
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	let decimals: number
	before(
		'load fixtures/parentable',
		async () =>
			({ payloadFactory, creator, kycContract, deployer, decimals } = await waffle.loadFixture(parentable))
	)

	/**
	 *      1.
	 *      Check if a newly created root asset is related to the same KYC contract
	 *      as the cargo created in fixtures
	 */

	let cargoContractA: PayloadAsset
	let cargoContractAaddress: string
	before('create root cargo contract [with starting KYC]', async () => {
		cargoContractAaddress = await payloadFactory
			.connect(creator)
			.create(
				'first.test.uri.com',
				'First rootSpaceCargo',
				decimals,
				parseUnits('2000', decimals),
				kycContract.address,
				0,
				false
			)
			.then(tx => tx.wait())
			.then(txr => getPayloadAddress(txr))

		cargoContractA = await ethers
			.getContractAt(contractNames.PAYLOAD_ASSET, cargoContractAaddress)
			.then(contract => contract as PayloadAsset)
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
	let cargoContractB: PayloadAsset
	before('create root cargo contract [with new KYC]', async () => {
		// create a new instance of KYC contact
		secondKYC = await ethers
			.getContractFactory(contract_names.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		// give factory permissions
		await payloadFactory.connect(deployer).addClient(userA.address)

		// add userA to secondKYC permissions
		await secondKYC.connect(deployer).setKycStatus(userA.address, true)

		// when creating a new contract, specify override KYC
		cargoContractBaddress = await payloadFactory
			.connect(userA)
			.create(
				'second.test.uri.com',
				'Second rootSpaceCargo',
				decimals,
				parseUnits('2000', decimals),
				secondKYC.address,
				0,
				false
			)
			.then(tx => tx.wait())
			.then(txr => getPayloadAddress(txr))

		cargoContractB = await ethers
			.getContractAt(contractNames.PAYLOAD_ASSET, cargoContractBaddress)
			.then(contract => contract as PayloadAsset)
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
			payloadFactory
				.connect(userA)
				.create(
					'revert.test.uri.com',
					'Revert rootSpaceCargo',
					decimals,
					parseUnits('2000', decimals),
					kycContract.address,
					0,
					false
				)
		).to.be.revertedWith('receiver/buyer is not on KYC list')

		// creator does not have KYC permissions on secondKYC
		await expect(
			payloadFactory
				.connect(creator)
				.create(
					'revert.test.uri.com',
					'Revert rootSpaceCargo',
					decimals,
					parseUnits('2000', decimals),
					secondKYC.address,
					0,
					false
				)
		).to.be.revertedWith('receiver/buyer is not on KYC list')
	})
})
