import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import contractNames from '../../../../constants/contract.names'
import { SpaceibleOffer } from '../../../../typechain'

export interface Deploy {
	deployer: SignerWithAddress
	spaceibleOffer: SpaceibleOffer
}

export const deploySpaceibleOffer: Fixture<Deploy> = async () => {
	const [deployer]: SignerWithAddress[] = await ethers.getSigners()

	const spaceibleOffer = await ethers
		.getContractFactory(contractNames.SPACEIBLE_OFFER)
		.then(factory => factory.deploy(deployer.address, 3000))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as SpaceibleOffer)

	return { deployer, spaceibleOffer }
}
