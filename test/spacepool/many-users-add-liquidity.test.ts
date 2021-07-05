import { ethers, waffle } from 'hardhat'
import { spacePoolFixture } from './space-pool.fixture'
import { ERC20Mock, SpacePool } from '../../typechain'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[many-users-add-liquidity.test.ts]', () => {
	let spacePool: SpacePool
	let liquidityToken: ERC20Mock

	before('load space pool deploy fixture', async () => {
		({
			liquidityToken,
			spacePool
		} = await waffle.loadFixture(spacePoolFixture))
	})

	let deployer, userA, userB, userC, userD: SignerWithAddress
	before('init signers', async () =>
		[deployer, userA, userB, userC, userD] = await ethers.getSigners())

	before('mint some mock tokens to users', async () => {
		const mintAmount = ethers.utils.parseUnits('1000', 18)
		await liquidityToken.mintTo(userA.address, mintAmount)
		await liquidityToken.mintTo(userB.address, mintAmount)
		await liquidityToken.mintTo(userC.address, mintAmount)
		await liquidityToken.mintTo(userD.address, mintAmount)

	})

	it('checks all users have zero liquidity initially', async () => {
		expect(await spacePool.connect(userA).getMyLiquidity())
			.to.be.eq('0')
		expect(await spacePool.connect(userB).getMyLiquidity())
			.to.be.eq('0')
		expect(await spacePool.connect(userC).getMyLiquidity())
			.to.be.eq('0')
		expect(await spacePool.connect(userD).getMyLiquidity())
			.to.be.eq('0')
	})

	const userALiquidityAmount = ethers.utils.parseUnits('1', 18)
	const userBLiquidityAmount = ethers.utils.parseUnits('100', 18)
	const userCLiquidityAmount = ethers.utils.parseUnits('42', 18)
	const userDLiquidityAmount = ethers.utils.parseUnits('0.42', 18)

	before('approve space pool contract to use users token', async () => {
		await liquidityToken
			.connect(userA)
			.approve(spacePool.address, userALiquidityAmount)
			.then(tx => tx.wait())

		await liquidityToken
			.connect(userB)
			.approve(spacePool.address, userBLiquidityAmount)
			.then(tx => tx.wait())

		await liquidityToken
			.connect(userC)
			.approve(spacePool.address, userCLiquidityAmount)
			.then(tx => tx.wait())

		await liquidityToken
			.connect(userD)
			.approve(spacePool.address, userDLiquidityAmount)
			.then(tx => tx.wait())
	})

	it('adds liquidity from userA', async () => {
		await spacePool
			.connect(userA)
			.addLiquidity(userALiquidityAmount)

		expect(await spacePool.connect(userA).getMyLiquidity())
			.to.be.eq(userALiquidityAmount)

		const lpnfts = await spacePool.connect(userA).getMyPositions()
		expect(lpnfts).to.have.length(1)
		const lpnft = lpnfts[0]
		expect(lpnft).to.have.property('timestamp')
		expect(lpnft).to.have.property('amount')
		expect(lpnft).to.have.property('poolEpoch')
	})


	it('adds liquidity from userB', async () => {
		await spacePool
			.connect(userB)
			.addLiquidity(userBLiquidityAmount)

		expect(await spacePool.connect(userB).getMyLiquidity())
			.to.be.eq(userBLiquidityAmount)

		const lpnfts = await spacePool.connect(userB).getMyPositions()
		expect(lpnfts).to.have.length(1)
		const lpnft = lpnfts[0]
		expect(lpnft).to.have.property('timestamp')
		expect(lpnft).to.have.property('amount').and.to.be.eq(userBLiquidityAmount)
		expect(lpnft).to.have.property('poolEpoch').eq('0')
	})

	it('adds liquidity from userC', async () => {
		await spacePool
			.connect(userC)
			.addLiquidity(userCLiquidityAmount)

		expect(await spacePool.connect(userC).getMyLiquidity())
			.to.be.eq(userCLiquidityAmount)

		const lpnfts = await spacePool.connect(userC).getMyPositions()
		expect(lpnfts).to.have.length(1)
		const lpnft = lpnfts[0]
		expect(lpnft).to.have.property('timestamp')
		expect(lpnft).to.have.property('amount').and.to.be.eq(userCLiquidityAmount)
		expect(lpnft).to.have.property('poolEpoch').eq('0')
	})

	it('adds liquidity from userD', async () => {
		await spacePool
			.connect(userD)
			.addLiquidity(userDLiquidityAmount)

		expect(await spacePool.connect(userD).getMyLiquidity())
			.to.be.eq(userDLiquidityAmount)

		const lpnfts = await spacePool.connect(userD).getMyPositions()
		expect(lpnfts).to.have.length(1)
		const lpnft = lpnfts[0]
		expect(lpnft).to.have.property('timestamp')
		expect(lpnft).to.have.property('amount').and.to.be.eq(userDLiquidityAmount)
		expect(lpnft).to.have.property('poolEpoch').eq('0')
	})

})
