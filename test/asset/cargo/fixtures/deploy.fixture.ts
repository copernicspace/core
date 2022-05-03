import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { KycRegister, PayloadFactory } from '../../../../typechain'
import contract_names from '../../../../constants/contract.names'

export interface Deploy {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	payloadFactory: PayloadFactory
	kycContract: KycRegister
}

/**
 * This fixture deploys:
 * * payload asset contract
 * * clone cargo factory
 *
 * for test suite @see `test/asset/deploy/deploy.test.ts`
 *
 * @returns blockchain state with result of fixture actions
 */

export const deployPayloadAsset: Fixture<Deploy> = async () => {
	const [deployer, creator]: SignerWithAddress[] = await ethers.getSigners()
	const cargoContractAddress = await ethers
		.getContractFactory(contract_names.PAYLOAD_ASSET)
		.then(factory => factory.connect(deployer).deploy(''))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)

	const kycContract = await ethers
		.getContractFactory(contract_names.KYC_REGISTER)
		.then(factory => factory.connect(deployer).deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as KycRegister)

	const payloadFactory = await ethers
		.getContractFactory(contract_names.PAYLOAD_FACTORY)
		.then(factory => factory.connect(deployer).deploy(cargoContractAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as PayloadFactory)
	return { deployer, creator, payloadFactory, cargoContractAddress, kycContract }
}
