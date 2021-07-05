import { ethers, waffle } from 'hardhat'
import { spacePoolFixture } from './space-pool.fixture'
import { ERC20Mock, SpacePool } from '../../typechain'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'

describe('[one-user-add-liquidity.test.ts]', () => {
	let spacePool: SpacePool
	let liquidityToken: ERC20Mock

	before('load space pool deploy fixture', async () => {
		({
			liquidityToken,
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

	it('reverts with error if not approved, on \'addLiquidity\' tx', async () =>
		await expect(
			spacePool.connect(user).addLiquidity(ethers.utils.parseUnits('50', 18)))
			.to.be.revertedWith('ERC20: transfer amount exceeds allowance'))

	const liquidityAmount = ethers.utils.parseUnits('50', 18)
	it('approves space pool contract to use user\'s liquidity token', async () => {
		const approveTxr = await liquidityToken
			.connect(user)
			.approve(spacePool.address, liquidityAmount)
			.then(tx => tx.wait())
		expect(approveTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
	})

	it('adds liquidity from user', async () => {
		const addLiquidityTxr = await spacePool
			.connect(user)
			.addLiquidity(liquidityAmount)
			.then(tx => tx.wait())
		expect(addLiquidityTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
	})

	it('has correct liquidity share for user A', async () =>
		expect(await spacePool.connect(user).getMyLiquidity()).to.be.eq(liquidityAmount))

	it('has minted correct LP NFT for user', async () => {
		const lpnfts = await spacePool.connect(user).getMyPositions()
		expect(lpnfts).to.have.length(1)
		const lpnft = lpnfts[0]
		expect(lpnft).to.have.property('timestamp')
		expect(lpnft).to.have.property('amount')
		expect(lpnft).to.have.property('poolEpoch')
	})

	const expectedAmount = ethers.utils.parseUnits('75', 18)
	it('adds more liquidity from user', async () => {
		const amount = ethers.utils.parseUnits('25', 18)
		await liquidityToken.connect(user).approve(spacePool.address, amount)
		await spacePool.connect(user).addLiquidity(amount)
		const actual = await spacePool.connect(user).getMyLiquidity()
		expect(actual).to.be.eq(expectedAmount)
	})
})
