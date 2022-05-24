import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { BigNumber } from 'ethers'
import { InstantOffer, KycRegister, PayloadAsset } from '../../../../../typechain'
import contract_names from '../../../../../constants/contract.names'
import { parseUnits } from 'ethers/lib/utils'
import { Create, deployPayloadAsset, loadFixtureState0, loadFixtureState1 } from './deployOffer.fixture'
import contractNames from '../../../../../constants/contract.names'
import { getPayloadAddress } from '../../../../helpers/payloadAddress'

const createPayloadAssetWithRoyalties: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixtureState0(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = parseUnits('5', decimals)

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

const createPayloadAssetWithFloatRoyalties: Fixture<Create> = async () => {
	const { deployer, creator, payloadFactory, kycContract } = await loadFixtureState1(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)
	const royalties = parseUnits('5.725', decimals)

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


export interface DeployInstantOffer {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	instantOffer: InstantOffer
	payloadAsset: PayloadAsset
	kycContract: KycRegister
	totalSupply: BigNumber
}

/**
 * This fixture deploys `InstantOffer` contract

 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */

export const deployInstantOfferWithRoyalties: Fixture<DeployInstantOffer> = async () => {
	const { deployer, creator, payloadAsset, kycContract, totalSupply } = await loadFixtureState0(
		createPayloadAssetWithRoyalties
	)
	const operatorFee = parseUnits('3', await payloadAsset.decimals())
	const instantOffer = await ethers
		.getContractFactory(contract_names.INSTANT_OFFER)
		.then(factory => factory.connect(deployer).deploy(deployer.address, operatorFee))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as InstantOffer)

	return { deployer, creator, instantOffer, payloadAsset, kycContract, totalSupply }
}

export const deployInstantOfferWithFloatFeesAndRoyalties: Fixture<DeployInstantOffer> = async () => {
	const { deployer, creator, payloadAsset, kycContract, totalSupply } = await loadFixtureState0(
		createPayloadAssetWithFloatRoyalties
	)
	const operatorFee = parseUnits('3.255', await payloadAsset.decimals())
	const instantOffer = await ethers
		.getContractFactory(contract_names.INSTANT_OFFER)
		.then(factory => factory.connect(deployer).deploy(deployer.address, operatorFee))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as InstantOffer)

	return { deployer, creator, instantOffer, payloadAsset, kycContract, totalSupply }
}
