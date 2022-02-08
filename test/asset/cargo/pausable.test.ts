import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { parseUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'

describe('[test/asset/cargo/pausable.test] SpaceCargo asset: pausable test suite', () => {
	let cargoContract: CargoAsset
	let creator, userA, receiver: SignerWithAddress
	before(
		'load fixtures/parentable`',
		async () => ({ cargoContract, creator, receiver } = await waffle.loadFixture(parentable))
	)

	it('only can be paused by creator', async () => {
		await expect(cargoContract.connect(receiver).pause()).to.be.revertedWith('unauthorized -- only for creator')
	})

	describe('transfers when asset `paused()`', async () => {
		before('load userA and transfer funds', async () => {
			// set up a signer who will send the asset
			;[, , userA] = await ethers.getSigners()
			await cargoContract.connect(creator).transfer(userA.address, 0, '100')
		})

		before('pause asset', async () => {
			await cargoContract.connect(creator).pause()
		})

		it('creator can successfully send tokens if paused', async () => {
			const amount = parseUnits('100', 18)

			const balanceStart = await cargoContract.balanceOf(receiver.address, 0)
			await cargoContract.connect(creator).transfer(receiver.address, 0, amount)
			const balanceEnd = await cargoContract.balanceOf(receiver.address, 0)

			expect(balanceStart.add(BigNumber.from(amount))).to.be.eq(balanceEnd)
		})

		it('non-creator cannot send tokens if paused', async () => {
			await expect(
				cargoContract.connect(userA).transfer(receiver.address, 0, parseUnits('100', 18))
			).to.be.revertedWith('PausableCargo: asset is locked')
		})
	})
})
