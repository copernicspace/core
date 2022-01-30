import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import { CargoAsset, InstantOffer, KycRegister } from '../../../../typechain'
import contract_names from '../../../../constants/contract.names'
import { createCargoAssetWithRoyalties } from '../../../asset/cargo/fixtures/create.fixture'
import { loadFixture } from '../../../helpers/fixtureLoader'

export interface DeployInstantOffer {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	instantOffer: InstantOffer
	cargoContract: CargoAsset
	kycContract: KycRegister
	totalSupply: BigNumber
}

/**
 * This fixture deploys `InstantOffer` contract

 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */

export const deployInstantOfferWithRoyalties: Fixture<DeployInstantOffer> = async () => {
	const { deployer, creator, cargoContract, kycContract, totalSupply } = await loadFixture(
		createCargoAssetWithRoyalties
	)
	const operatorFee = '3'
	const instantOffer = await ethers
		.getContractFactory(contract_names.INSTANT_OFFER)
		.then(factory => factory.connect(deployer).deploy(deployer.address, operatorFee))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as InstantOffer)

	return { deployer, creator, instantOffer, cargoContract, kycContract, totalSupply }
}
