import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { CargoAsset } from '../../../../typechain'
import contract_names from '../../../../constants/contract.names'

export interface Deploy {
	deployer: SignerWithAddress
	cargoContract: CargoAsset
}
/**
 * // todo link below does not work ;(
 * @see {@link test/asset/deploy/deploy.test.ts}
 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */
export const deploy: Fixture<Deploy> = async () => {
	const [deployer]: SignerWithAddress[] = await ethers.getSigners()
	const cargoContract: CargoAsset = await ethers
		.getContractFactory(contract_names.CARGO_ASSET)
		.then(factory => factory.connect(deployer).deploy('test.uri'))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as CargoAsset)
	return { deployer, cargoContract }
}
