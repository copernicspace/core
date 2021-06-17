import { ethers, waffle } from 'hardhat'
import { spacePoolFixture } from './space-pool.fixture'
import { ERC20Mock, SpacePool } from '../../typechain'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ContractReceipt } from 'ethers'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'

describe('[one-user-add-liquidity.test.ts]', () => {
	let spacePool: SpacePool
	let liquidityToken: ERC20Mock
	let polToken: ERC20Mock

	before('load space pool deploy fixture', async () => {
		({
			liquidityToken,
			polToken,
			spacePool
		} = await waffle.loadFixture(spacePoolFixture))
	})

	let deployer, user: SignerWithAddress
	before('init signers', async () =>
		[deployer, user] = await ethers.getSigners())

	before('mint some mock tokens', async () => {
		const mintAmount = ethers.utils.parseUnits('1000', 18)
		await liquidityToken.mintTo(user.address, mintAmount)
	})

	it('is zero liquidity balance on the user', async () =>
		expect(await spacePool.connect(user).getMyLiquidity()).to.be.eq('0'))

	it('reverts with error if not approved', async () =>
		await expect(
			spacePool.connect(user)
				.addLiquidity(ethers.utils.parseUnits('50', 18)))
			.to.be.revertedWith('ERC20: transfer amount exceeds allowance'))

	const liquidityAmount = ethers.utils.parseUnits('50', 18)
	let approveTxr: ContractReceipt
	before('approve space pool contract to use user liquidity token', async () =>
		approveTxr = await liquidityToken
			.connect(user)
			.approve(spacePool.address, liquidityAmount)
			.then(tx => tx.wait()))

	it('successfully approved to spend liq tokens', async () =>
		expect(approveTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let addLiquidityTxr: ContractReceipt
	before('add liquidity from user', async () =>
		addLiquidityTxr = await spacePool
			.connect(user)
			.addLiquidity(liquidityAmount)
			.then(tx => tx.wait()))

	it('OK tx status for add liquidity', async () =>
		expect(addLiquidityTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	it('has correct liquidity share for user A', async () =>
		expect(await spacePool.connect(user).getMyLiquidity())
			.to.be.eq(liquidityAmount))

	it('has correct balance of PoL token', async () =>
		expect(await polToken.balanceOf(user.address)).to.be.eq(liquidityAmount))


	const expectedAmount = ethers.utils.parseUnits('75', 18)
	it('adds more liquidity from user', async () => {
		const amount = ethers.utils.parseUnits('25', 18)
		await liquidityToken.connect(user).approve(spacePool.address, amount)
		await spacePool.connect(user).addLiquidity(amount)
		const actual = await spacePool.connect(user).getMyLiquidity()
		expect(actual).to.be.eq(expectedAmount)
	})

	it('assert PoL token balance', async () =>
		expect(await polToken.balanceOf(user.address)).to.be.eq(expectedAmount))
})
