import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { CargoFactory } from '../../../../typechain'
import contract_names from '../../../../constants/contract.names'
import { Address } from 'cluster'

export interface Deploy {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	cargoFactory: CargoFactory
	kycContractAddress: string
}

/**
 * This fixture deploys cargo asset contract
 * as template for clone factory,
 * and clone cargo factory
 * // todo link below does not work ;(
 * @see {@link test/asset/deploy/deploy.test.ts}
 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */

export const deploy: Fixture<Deploy> = async () => {
	const [deployer, creator]: SignerWithAddress[] = await ethers.getSigners()
	const cargoContractAddress = await ethers
		.getContractFactory(contract_names.CARGO_ASSET)
		.then(factory => factory.connect(deployer).deploy(''))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)

	const kycContractAddress = await ethers
		.getContractFactory(contract_names.KYC_REGISTER)
		.then(factory => factory.connect(deployer).deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)

	const cargoFactory = await ethers
		.getContractFactory(contract_names.CARGO_FACTORY)
		.then(factory => factory.connect(deployer).deploy(cargoContractAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as CargoFactory)

	return { deployer, creator, cargoFactory, cargoContractAddress, kycContractAddress }
}
