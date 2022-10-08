import { waffle } from 'hardhat'
import { expect } from 'chai'
import { parseUnits } from '@ethersproject/units'
import { PayloadAsset } from '../../../../typechain'
import { createPayloadAssetWithRoyalties } from './fixtures/create.fixture'

describe('[spacemart/assets/payload/royalties.test] SpacePayload asset with royalties', () => {
	let payloadAsset: PayloadAsset

	beforeEach(
		'load fixtures/deploy`',
		async () => ({ payloadAsset } = await waffle.loadFixture(createPayloadAssetWithRoyalties))
	)

	it('has correct royalties percent', async () => {
		const actual = await payloadAsset.rootRoyalties()
		const decimals = await payloadAsset.decimals()
		const expected = parseUnits('5', decimals)
		expect(expected).to.be.eq(actual)
	})
})
