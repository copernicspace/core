import {ethers, waffle} from 'hardhat'
import {ERC20Mock, SpacePool} from '../../typechain'
import {Fixture} from 'ethereum-waffle'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {parseUnits} from 'ethers/lib/utils'

interface SpacePoolFixture {
  liquidityToken: ERC20Mock;
  spacePool: SpacePool;
}

export const spacePoolFixture: Fixture<SpacePoolFixture> = async function ():
    Promise<SpacePoolFixture> {

	const liquidityToken: ERC20Mock = await ethers.getContractFactory('ERC20Mock')
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as ERC20Mock)

	const spacePool = await ethers.getContractFactory('SpacePool')
		.then(factory => factory.deploy(liquidityToken.address))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as SpacePool)

	return {liquidityToken, spacePool}
}

export const spacePoolWithLiquidityFixture: Fixture<SpacePoolFixture> = async function ():
    Promise<SpacePoolFixture> {
	let deployer, user: SignerWithAddress
	// eslint-disable-next-line prefer-const,@typescript-eslint/no-unused-vars
	[deployer, user] = await ethers.getSigners()

	const {
		liquidityToken,
		spacePool
	} = await waffle.loadFixture(spacePoolFixture)

	// mint 100 tokens
	const amount = parseUnits('100', 18)
	await liquidityToken.connect(user).mint(amount)

	// add liquidity to the space pool
	await liquidityToken.connect(user).approve(spacePool.address, amount)
	await spacePool.connect(user).addLiquidity(amount)

	return {liquidityToken, spacePool}
}
