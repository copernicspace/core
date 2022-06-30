import { ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { SpaceibleOffer } from '../../../typechain'
import { setupSpaceibleOffer } from './fixtures/setupOffer.fixture'
import exp from 'constants'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/cancel] `SpaceibleOffer::cancel` test suite', () => {
	let offer: any
	let spaceibleOffer: SpaceibleOffer
	let seller: SignerWithAddress
	let user: SignerWithAddress
	let cancelTx: ContractTransaction

	before(
		'load offer/fixtures/setupOffer',
		async () => ({ offer, spaceibleOffer, seller } = await loadFixture(setupSpaceibleOffer))
	)

	before('load user signer', async () => ([, , user] = await ethers.getSigners()))

	describe('default `canceled` state checks', () => {
		it('should have `isCanceled` false by default after `offer.sell` tx', async () =>
			expect(await spaceibleOffer.isCanceled(offer.id)).to.be.false)
	})

	describe('access to `cancel` function', () => {
		it('should revert on `cancel` tx, if user is not offer seller', async () =>
			await expect(spaceibleOffer.connect(user).cancel(offer.id)).to.be.revertedWith(
				'Only offer seller can cancel'
			))

		it('should not revert on `cancel` tx if user is seller', async () => {
			cancelTx = await spaceibleOffer.connect(seller).cancel(offer.id)
			await expect(cancelTx.wait()).not.to.be.reverted
		})
	})

	describe('`canceled` state for offer after `cancel` tx', () => {
		it('should emit `Cancel` event after `cancel` tx', async () =>
			await expect(cancelTx).to.emit(spaceibleOffer, 'Cancel').withArgs(offer.id))

		it('should have paused status after pause tx', async () =>
			expect(await spaceibleOffer.isCanceled(offer.id)).to.be.true)
	})
})
