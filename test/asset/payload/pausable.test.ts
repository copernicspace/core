import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parentable } from './fixtures/parentable.fixture'
import { PayloadAsset } from '../../../typechain'

describe('[test/asset/payload/pausable.test] SpacePayload asset: pausable test suite', () => {
	let payloadAsset: PayloadAsset
	let creator: SignerWithAddress, receiver: SignerWithAddress

	before(
		'load fixtures/parentable`',
		async () => ({ payloadAsset, creator, receiver } = await waffle.loadFixture(parentable))
	)

	it('only can be paused by creator', async () => {
		await expect(payloadAsset.connect(receiver).pause()).to.be.revertedWith('Creator: caller is not the creator')
	})

	describe('transfers when asset `paused()`', async () => {
		const amount = parseUnits('100', 18)

		before(
			'send to `userA`',
			async () =>
				await payloadAsset.connect(creator).safeTransferFrom(creator.address, receiver.address, 0, amount, '0x')
		)

		before('pause asset', async () => await payloadAsset.connect(creator).pause())

		it('creator can successfully send tokens if paused', async () => {
			const balanceStart = await payloadAsset.balanceOf(receiver.address, 0)
			await payloadAsset.connect(creator).safeTransferFrom(creator.address, receiver.address, 0, amount, '0x')
			const balanceEnd = await payloadAsset.balanceOf(receiver.address, 0)

			expect(balanceStart.add(BigNumber.from(amount))).to.be.eq(balanceEnd)
		})

		it('non-creator cannot send tokens if paused', async () => {
			await expect(
				payloadAsset.connect(receiver).safeTransferFrom(receiver.address, creator.address, 0, amount, '0x')
			).to.be.revertedWith('Pausable: asset is locked')
		})
	})
})
