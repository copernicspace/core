import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import { InstantOffer, KycRegister, PayloadAsset } from '../../../../typechain'
import contract_names from '../../../../constants/contract.names'
import {
	createPayloadAssetWithFloatRoyalties,
	createPayloadAssetWithRoyalties
} from '../../../asset/payload/fixtures/create.fixture'
import { loadFixture } from '../../../helpers/fixtureLoader'
import { parseUnits } from 'ethers/lib/utils'

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
	const { deployer, creator, payloadAsset, kycContract, totalSupply } = await loadFixture(
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
	const { deployer, creator, payloadAsset, kycContract, totalSupply } = await loadFixture(
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
