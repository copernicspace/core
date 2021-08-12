import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { parseUnits } from 'ethers/lib/utils'
import { ethers, waffle } from 'hardhat'
import { ERC20Mock, SpacePool } from '../../typechain'

interface SpacePoolFixture {
	liquidityToken: ERC20Mock
	spacePool: SpacePool
}

export const spacePoolFixture: Fixture<SpacePoolFixture> = async (): Promise<SpacePoolFixture> => {
	const liquidityToken: ERC20Mock = await ethers
		.getContractFactory('ERC20Mock')
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as ERC20Mock)

	const spacePool = await ethers
		.getContractFactory('SpacePool')
		.then(factory => factory.deploy(liquidityToken.address))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as SpacePool)

	return { liquidityToken, spacePool }
}

export const spacePoolWithLiquidityFixture: Fixture<SpacePoolFixture> = async (): Promise<SpacePoolFixture> => {
	const [_, user]: SignerWithAddress[] = await ethers.getSigners()

	const { liquidityToken, spacePool } = await waffle.loadFixture(spacePoolFixture)

	// mint 100 tokens
	const amount = parseUnits('100', 18)
	await liquidityToken.connect(user).mint(amount)

	// add liquidity to the space pool
	await liquidityToken.connect(user).approve(spacePool.address, amount)
	await spacePool.connect(user).addLiquidity(amount)

	return { liquidityToken, spacePool }
}
