import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'

import { EscrowListing, KycRegister, PayloadFactory } from '../../../../../typechain'
import contractNames from '../../../../../utils/constants/contract.names'
import { Deploy, deployPayloadAsset } from '../../../assets/payload/fixtures/deploy.fixture'

export interface DeployEscrowListing {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	payloadFactory: PayloadFactory
	kycContract: KycRegister
	escrowListing: EscrowListing
	decimals: number
}

export const deployEscrowListing: Fixture<DeployEscrowListing> = async () => deploy(deployPayloadAsset, '3', 6)

const deploy = async (fixture: Fixture<Deploy>, operatorFee: string, decimals: number) => {
	const loadFixture = waffle.createFixtureLoader()
	const { deployer, creator, payloadFactory, kycContract } = await loadFixture(fixture)
	const operatorFeeBN = parseUnits(operatorFee, decimals)
	const escrowListing = await ethers
		.getContractFactory(contractNames.ESCROW_LISTING)
		.then(factory => factory.connect(deployer).deploy(deployer.address, operatorFeeBN))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as EscrowListing)

	return { deployer, creator, payloadFactory, kycContract, escrowListing, decimals }
}
