import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { BigNumber } from 'ethers'

import { InstantOffer, KycRegister, PayloadAsset } from '../../../../../typechain'
import contractNames from '../../../../../constants/contract.names'
import {
	Create,
	createPayloadAsset,
	createPayloadAssetWithFloatRoyalties,
	createPayloadAssetWithRoyalties
} from '../../../assets/payload/fixtures/create.fixture'

export interface DeployInstantOffer {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	instantOffer: InstantOffer
	payloadAsset: PayloadAsset
	kycContract: KycRegister
	totalSupply: BigNumber
}

export const deployInstantOffer: Fixture<DeployInstantOffer> = async () => deploy(createPayloadAsset, '3')

export const deployInstantOfferWithRoyalties: Fixture<DeployInstantOffer> = async () =>
	deploy(createPayloadAssetWithRoyalties, '3')

export const deployInstantOfferWithFloatFeesAndRoyalties: Fixture<DeployInstantOffer> = async () =>
	deploy(createPayloadAssetWithFloatRoyalties, '3.25')

const deploy = async (fixture: Fixture<Create>, operatorFee: string) => {
	const loadFixture = waffle.createFixtureLoader()
	const { deployer, creator, payloadAsset, kycContract, totalSupply } = await loadFixture(fixture)
	const operatorFeeBN = parseUnits(operatorFee, await payloadAsset.decimals())
	const instantOffer = await ethers
		.getContractFactory(contractNames.INSTANT_OFFER)
		.then(factory => factory.connect(deployer).deploy(deployer.address, operatorFeeBN))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as InstantOffer)

	return { deployer, creator, instantOffer, payloadAsset, kycContract, totalSupply }
}
