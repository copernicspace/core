import { ethers } from 'hardhat'
import { ERC20Mock, SpacePool } from '../../typechain'
import { Fixture } from 'ethereum-waffle'

interface SpacePoolFixture {
	liquidityToken: ERC20Mock;
	polToken: ERC20Mock;
	spacePool: SpacePool;
}

export const spacePoolFixture: Fixture<SpacePoolFixture> = async function():
	Promise<SpacePoolFixture> {

	const liquidityToken: ERC20Mock = await ethers.getContractFactory('ERC20Mock')
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as ERC20Mock)

	const polToken: ERC20Mock = await ethers.getContractFactory('ERC20Mock')
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as ERC20Mock)

	const spacePool = await ethers.getContractFactory('SpacePool')
		.then(factory => factory.deploy(liquidityToken.address, polToken.address))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as SpacePool)

	return { liquidityToken, polToken, spacePool }
}
