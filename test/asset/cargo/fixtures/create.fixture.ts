import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'

import { deployPayloadAsset, Deploy } from './deploy.fixture'
import contractNames from '../../../../constants/contract.names'
import { getPayloadAddress } from '../../../helpers/cargoAddress'
import { PayloadAsset } from '../../../../typechain'
import { loadFixture } from '../../../helpers/fixtureLoader'

export interface Create extends Deploy {
	payloadAsset: PayloadAsset
	totalSupply: BigNumber
	decimals: number
}

export const createPayloadAsset: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixture(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = 0

	await payloadFactory.connect(deployer).addClient(creator.address)

	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const cargoContractAddress = await payloadFactory
		.connect(creator)
		.create('test.uri.com', 'rootSpaceCargoName', decimals, totalSupply, kycContract.address, royalties, false)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, cargoContractAddress)
		.then(contract => contract as PayloadAsset)

	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}

export const createPayloadAssetPaused: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixture(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = 0

	await payloadFactory.connect(deployer).addClient(creator.address)
	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const cargoContractAddress = await payloadFactory
		.connect(creator)
		.create('test.uri.com', 'rootSpaceCargoName', decimals, totalSupply, kycContract.address, royalties, true)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, cargoContractAddress)
		.then(contract => contract as PayloadAsset)

	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}

export const createCargoAssetWithRoyalties: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixture(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = parseUnits('5', decimals)

	await payloadFactory.connect(deployer).addClient(creator.address)

	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const cargoContractAddress = await payloadFactory
		.connect(creator)
		.create('test.uri.com', 'rootSpaceCargoName', decimals, totalSupply, kycContract.address, royalties, false)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, cargoContractAddress)
		.then(contract => contract as PayloadAsset)

	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}

export const createCargoAssetWithFloatRoyalties: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixture(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = parseUnits('5.725', decimals)

	await payloadFactory.connect(deployer).addClient(creator.address)

	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const cargoContractAddress = await payloadFactory
		.connect(creator)
		.create('test.uri.com', 'rootSpaceCargoName', decimals, totalSupply, kycContract.address, royalties, false)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, cargoContractAddress)
		.then(contract => contract as PayloadAsset)

	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}
