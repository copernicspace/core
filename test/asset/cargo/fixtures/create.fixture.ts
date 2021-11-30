import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deploy, Deploy } from './deploy.fixture'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { CargoAsset, KycRegister } from '../../../../typechain'
import { getCargoAddress } from '../../../helpers/cargoAddress'
import contractNames from '../../../../constants/contract.names'
import { parseUnits } from '@ethersproject/units'
import { loadFixture } from './fixtureLoader'

export interface Create extends Deploy {
	creator: SignerWithAddress
	cargoContract: CargoAsset
	totalSupply: BigNumber
	decimals: number
	kycContract: KycRegister
}

export const create: Fixture<Create> = async () => {
	const { deployer, creator, cargoFactory, kycContract } = await loadFixture(deploy)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)

	await cargoFactory.connect(deployer).addClient(creator.address)

	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const cargoContractAddress = await cargoFactory
		.connect(creator)
		.createCargo('test.uri.com', 'rootSpaceCargoName', decimals, totalSupply, kycContract.address)
		.then(tx => tx.wait())
		.then(txr => getCargoAddress(txr))

	const cargoContract = await ethers
		.getContractAt(contractNames.CARGO_ASSET, cargoContractAddress)
		.then(contract => contract as CargoAsset)

	return { deployer, creator, cargoFactory, cargoContract, totalSupply, decimals, kycContract }
}
