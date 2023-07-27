import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'

import contractNames from '../../../../utils/constants/contract.names'
import { SpaceibleAsset, SpaceibleOffer } from '../../../../typechain'
import { deploySpaceibleAsset } from '../../asset/fixtures/deploy.fixture'

export interface Deploy {
	deployer: SignerWithAddress
	spaceibleAsset: SpaceibleAsset
	spaceibleOffer: SpaceibleOffer
}

export const deploySpaceibleOffer: Fixture<Deploy> = async () => {
	const [deployer]: SignerWithAddress[] = await ethers.getSigners()
	const { spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset)
	const spaceibleOffer = await ethers
		.getContractFactory(contractNames.SPACEIBLE_OFFER)
		.then(factory => factory.deploy(deployer.address, 300, spaceibleAsset.address))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as SpaceibleOffer)

	return { deployer, spaceibleAsset, spaceibleOffer }
}
