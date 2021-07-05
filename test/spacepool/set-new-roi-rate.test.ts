import {ERC20Mock, SpacePool} from '../../typechain'
import {waffle} from 'hardhat'
import {spacePoolFixture} from './space-pool.fixture'
import {expect} from 'chai'

describe('[set-new-roi-rate.test.ts]', () => {
	let spacePool: SpacePool
	let liquidityToken: ERC20Mock

	before('load space pool deploy fixture', async () => {
		({
			liquidityToken,
			spacePool
		} = await waffle.loadFixture(spacePoolFixture))
	})

	it('reverts if user can not set new roi rate', async () =>
		await expect(spacePool.setRoIRate('100'))
			.to.be.revertedWith('Caller can not set RoI rate')
	)
})
