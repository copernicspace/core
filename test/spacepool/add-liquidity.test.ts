import { ethers, waffle } from 'hardhat'
import { spacePoolFixture } from './space-pool.fixture'
import { ERC20, ERC20Mock, IERC20, SpacePool } from '../../typechain'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ContractReceipt } from 'ethers'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'
import exp from 'constants'

describe('[add-liquidity.test.ts] Space pool add liquidity test suite', () => {
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

	let deployer, userA, userB: SignerWithAddress
	before('init signers', async () =>
		[deployer, userA, userB] = await ethers.getSigners())

	before('mint some mock tokens', async () => {
		const mintAmount = ethers.utils.parseUnits('1000', 18)
		await liquidityToken.mintTo(userA.address, mintAmount)
	})

	it('is zero liquidity balance on the user', async () =>
		expect(await spacePool.getMyLiquidity()).to.be.eq('0'))

	it('reverts with error if not approved', async () =>
		await expect(
			spacePool.connect(userA)
				.addLiquidity(ethers.utils.parseUnits('50', 18)))
			.to.be.revertedWith('ERC20: transfer amount exceeds allowance'))

	const liquidityAmount = ethers.utils.parseUnits('50', 18)
	let approveTxr: ContractReceipt
	before('approve space pool contract to use UserA liquidity token', async () =>
		approveTxr = await liquidityToken
			.connect(userA)
			.approve(spacePool.address, liquidityAmount)
			.then(tx => tx.wait()))

	it('successfully approved to spend liq tokens', async () =>
		expect(approveTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let addLiquidityTxr: ContractReceipt
	before('add liquidity from userA', async () =>
		addLiquidityTxr = await spacePool
			.connect(userA)
			.addLiquidity(liquidityAmount)
			.then(tx => tx.wait()))

	it('OK tx status for add liquidity', async () =>
		expect(addLiquidityTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	it('has correct liquidity share for user A', async () =>
		expect(await spacePool.connect(userA).getMyLiquidity())
			.to.be.eq(liquidityAmount))

	it('has correct balance of PoL token', async () =>
		expect(await polToken.balanceOf(userA.address)).to.be.eq(liquidityAmount))
})
