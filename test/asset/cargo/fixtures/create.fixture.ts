import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deploy, Deploy } from './deploy.fixture'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { CargoAsset } from '../../../../typechain'
import { getCargoAddress } from '../../../helpers/cargoAddress'
import contractNames from '../../../../constants/contract.names'

export interface Create extends Deploy {
	creator: SignerWithAddress
	cargoContract: CargoAsset
	totalSupply: BigNumber
}

export const create: Fixture<Create> = async () => {
	const { deployer, cargoFactory } = await waffle.loadFixture(deploy)
	const [, creator] = await ethers.getSigners()
	const totalSupply = BigNumber.from(3500)
	const cargoContract = await cargoFactory
		.createCargo('test.uri.com', 'MyTestName', 18, totalSupply)
		.then(tx => tx.wait())
		.then(txr => getCargoAddress(txr))
		.then(address => ethers.getContractAt(contractNames.CARGO_ASSET, address))
		.then(contract => contract as CargoAsset)

	return { deployer, cargoFactory, creator, cargoContract, totalSupply }
}
