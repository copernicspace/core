import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deploy, Deploy } from './deploy.fixture'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { CargoAsset, KycRegister } from '../../../../typechain'
import { getCargoAddress } from '../../../helpers/cargoAddress'
import contractNames from '../../../../constants/contract.names'
import { parseUnits } from '@ethersproject/units'
import { loadFixture } from './fixtureLoader'
import { Address } from 'cluster'

export interface Create extends Deploy {
	creator: SignerWithAddress
	cargoContract: CargoAsset
	totalSupply: BigNumber
	decimals: number
	kycContractAddress: string
	kycContract: KycRegister
}

export const create: Fixture<Create> = async () => {
	const { deployer, creator, cargoFactory, kycContractAddress } = await loadFixture(deploy)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)

	await cargoFactory.connect(deployer).addClient(creator.address)

	const cargoContractAddress = await cargoFactory
		.connect(creator)
		.createCargo('test.uri.com', 'rootSpaceCargoName', decimals, totalSupply, kycContractAddress)
		.then(tx => tx.wait())
		.then(txr => getCargoAddress(txr))

	const cargoContract = await ethers
		.getContractAt(contractNames.CARGO_ASSET, cargoContractAddress)
		.then(contract => contract as CargoAsset)

	const kycContract = await ethers
		.getContractAt(contractNames.KYC_REGISTER, kycContractAddress)
		.then(contract => contract as KycRegister)

	return { deployer, creator, cargoFactory, cargoContract, totalSupply, decimals, kycContractAddress, kycContract }
}
