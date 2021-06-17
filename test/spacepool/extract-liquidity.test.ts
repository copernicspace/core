import { ERC20Mock, SpacePool } from '../../typechain'
import { ethers, waffle } from 'hardhat'
import { spacePoolWithLiquidityFixture } from './space-pool.fixture'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'

describe('[extract-liquidity.test.ts]', () => {
	let spacePool: SpacePool
	let liquidityToken: ERC20Mock
	let polToken: ERC20Mock

	before('load space pool deploy fixture', async () => {
		({
			liquidityToken,
			polToken,
			spacePool
		} = await waffle.loadFixture(spacePoolWithLiquidityFixture))
	})

	let deployer, user, userLiqOper: SignerWithAddress
	before('init signers', async () =>
		[deployer, user, userLiqOper] = await ethers.getSigners())

	it('grants user liquidity operator role', async () => {
		// add liquidity operator
		const tx = await spacePool.connect(deployer)
			.addLiquidityOperator(userLiqOper.address)

		// tx call for bytes of liq operator role
		const liqOperRole = await spacePool.LIQUIDITY_OPERATOR()

		// assert user was granted the liq oper role
		expect(await spacePool.hasRole(liqOperRole, userLiqOper.address))
			.to.be.true

		// assert event emission
		expect(tx).to.emit(spacePool, 'RoleGranted')
			.withArgs(liqOperRole, userLiqOper.address, deployer.address)
	})

	it('reverts if caller is not liq operator', async () =>
		await expect(
			spacePool.connect(user)
				.extractLiquidity(parseUnits('1000000', 18), userLiqOper.address))
			.to.be.revertedWith('Caller is not a liquidity operator'))

	it('reverts if requested with  unavailable liquidity amount', async () =>
		await expect(
			spacePool.connect(userLiqOper)
				.extractLiquidity(parseUnits('1000000', 18), userLiqOper.address))
			.to.be.revertedWith('There is not enough liquidity'))

	it('successfully extracted liquidity', async () => {
		await expect(() =>
			spacePool
				.connect(userLiqOper)
				.extractLiquidity(parseUnits('50', 18), userLiqOper.address))
			.to.changeTokenBalance(liquidityToken, userLiqOper, parseUnits('50', 18))

	})
})
