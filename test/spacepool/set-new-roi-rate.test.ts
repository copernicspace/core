import { ERC20Mock, SpacePool } from '../../typechain'
import { waffle } from 'hardhat'
import { spacePoolFixture } from './space-pool.fixture'

describe('[set-new-roi-rate.test.ts', () => {a
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

	it('reverts if user can not set new roi rate', async  () =>
		await (spacePool.setRoIRate(''))
	)
})
