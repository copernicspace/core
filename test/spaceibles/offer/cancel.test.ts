import { ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { ERC20Mock, SpaceibleOffer } from '../../../typechain'
import { setupSpaceibleOffer } from './fixtures/setupOffer.fixture'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/cancel] `SpaceibleOffer::cancel` test suite', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let offer: any
	let spaceibleOffer: SpaceibleOffer
	let seller: SignerWithAddress
	let user: SignerWithAddress
	let cancelTx: ContractTransaction
	let money: ERC20Mock

	before(
		'load offer/fixtures/setupOffer',
		async () => ({ offer, spaceibleOffer, seller, money } = await loadFixture(setupSpaceibleOffer))
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

	describe('access checks on canceled offer', () => {
		const expectedRevertMsg = 'Offer is canceled'
		it('should revert on `buy` tx, if offer is canceled', async () =>
			await expect(spaceibleOffer.connect(user).buy(offer.id, 10)).to.be.revertedWith(expectedRevertMsg))

		it('should revert on `edit` tx, if offer is canceled', async () =>
			await expect(spaceibleOffer.connect(user).edit(offer.id, 1, 1, money.address)).to.be.revertedWith(
				expectedRevertMsg
			))

		it('should revert on `cancel` tx, if offer is already canceled', async () =>
			await expect(spaceibleOffer.connect(user).cancel(offer.id)).to.be.revertedWith(expectedRevertMsg))
	})
})
