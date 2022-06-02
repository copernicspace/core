import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { InstantOffer, KycRegister, PayloadAsset, PayloadFactory } from '../../../../../typechain'
import contract_names from '../../../../../constants/contract.names'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { getPayloadAddress } from '../../../../helpers/payloadAddress'
import contractNames from '../../../../../constants/contract.names'

export const loadFixtureState0: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()
export const loadFixtureState1: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

export interface DeployInstantOffer {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	instantOffer: InstantOffer
	payloadAsset: PayloadAsset
	kycContract: KycRegister
	totalSupply: BigNumber
}

export interface Deploy {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	payloadFactory: PayloadFactory
	kycContract: KycRegister
}

/**
 * This fixture deploys `InstantOffer` contract

 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */

export const deployPayloadAsset: Fixture<Deploy> = async () => {
	const [deployer, creator]: SignerWithAddress[] = await ethers.getSigners()
	const payloadContractAddress = await ethers
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
		.then(factory => factory.connect(deployer).deploy(payloadContractAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as PayloadFactory)

	return { deployer, creator, payloadFactory, payloadContractAddress, kycContract }
}

export interface Create extends Deploy {
	payloadAsset: PayloadAsset
	totalSupply: BigNumber
	decimals: number
}

export const createPayloadAsset: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixtureState0(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = 0

	await payloadFactory.connect(deployer).addClient(creator.address)

	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const payloadContractAddress = await payloadFactory
		.connect(creator)
		.create('test.uri.com', 'rootSpacePayloadName', decimals, totalSupply, kycContract.address, royalties, false)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, payloadContractAddress)
		.then(contract => contract as PayloadAsset)

	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}

export const deployInstantOffer: Fixture<DeployInstantOffer> = async () => {
	const { deployer, creator, payloadAsset, kycContract, totalSupply } = await loadFixtureState1(createPayloadAsset)

	const operatorFee = parseUnits('3', await payloadAsset.decimals())

	const instantOffer = await ethers
		.getContractFactory(contract_names.INSTANT_OFFER)
		.then(factory => factory.connect(deployer).deploy(deployer.address, operatorFee))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as InstantOffer)

	return { deployer, creator, instantOffer, payloadAsset, kycContract, totalSupply }
}
