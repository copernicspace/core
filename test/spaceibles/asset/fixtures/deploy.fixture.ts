import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import contractNames from '../../../../utils/constants/contract.names'
import { SpaceibleAsset } from '../../../../typechain'

export interface Deploy {
	deployer: SignerWithAddress
	spaceibleAsset: SpaceibleAsset
	baseURI: string
}

export const deploySpaceibleAsset: Fixture<Deploy> = async () => {
	const [deployer]: SignerWithAddress[] = await ethers.getSigners()

	const baseURI = 'ipfs://'

	const spaceibleAsset = await ethers
		.getContractFactory(contractNames.SPACEIBLE_ASSET)
		.then(factory => factory.deploy(baseURI))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as SpaceibleAsset)

	return { deployer, spaceibleAsset, baseURI }
}
