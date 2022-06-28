import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { waffle } from 'hardhat'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { setupSpaceibleOffer } from './fixtures/setupOffer.fixture'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/availableBalance] test set for available balance', () => {
	let asset, offer
	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer
	let deployer, seller: SignerWithAddress
	let money: ERC20Mock
	let newOfferID
	before(
		'load offer/fixtures/setupOffer',
		async () => ({ 
			asset, 
			offer, 
			spaceibleAsset, 
			spaceibleOffer,
			money,
			deployer,
			seller
		} = await loadFixture(setupSpaceibleOffer))
	)

	// asset.balance is 100
	// starting offer.amount is 50 (0.5 * asset.balance)

	describe('check starting balance', async () => {
		it('`getAvailableBalance` should return balance of 0.5 * asset.balance', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = asset.balance * 0.5
			expect(expected).to.be.eq(availableBal)
		})
		it('`getAvailableBalance` should return balance of 50', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = 50
			expect(expected).to.be.eq(availableBal)
		})
	})

	describe('edit first offer', async () => {
		it('reverts edit if amount > user balance', async () => {
			// edit offer to be bigger than the available balance
			await expect(
				spaceibleOffer.connect(seller)
				.editOffer(offer.id, asset.balance + 1, offer.price, money.address)
			).to.be.revertedWith('Asset amount accross offers exceeds balance')
		})
		it('returns correct value for availableBalance after revert', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = asset.balance * 0.5
			expect(expected).to.be.eq(availableBal)
		})
		it('does not revert edit if amount <= user balance', async() => {
			// edit offer to be within the available balance
			const tx = await (
				await spaceibleOffer.connect(seller)
				.editOffer(offer.id, asset.balance, offer.price, money.address)).wait()
			expect(tx.status).to.be.eq(1)
		})
		it('returns correct value for availableBalance', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = 0
			expect(expected).to.be.eq(availableBal)
		})
		after('return to starting state', async () => {
			await spaceibleOffer.connect(seller)
				.editOffer(offer.id, asset.balance * 0.5, offer.price, money.address)
		})
	})

	describe('create second offer', async () => {
		// create a new offer with balance being one over the available balance
		it('reverts sell if insufficient available balance', async() => {
			// try to create new offer so that the amount is 1 above the available balance
			await expect(
				spaceibleOffer.connect(seller)
				.sell(asset.id, asset.balance * 0.5 + 1, offer.price, money.address)
			).to.be.revertedWith('Asset amount accross offers exceeds balance')
		})
		it('returns correct value for availableBalance after revert', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = asset.balance * 0.5
			expect(expected).to.be.eq(availableBal)
		})
		// create a new offer with balance equal to max available
		it('does not revert sell if total amount within user balance', async() => {
			const tx = await spaceibleOffer.connect(seller)
				.sell(asset.id, asset.balance * 0.5, offer.price, money.address)
				.then(tx => tx.wait())
        		.then(txr => (newOfferID = getOfferId(txr)))
		})
		it('returns correct value for availableBalance', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = 0
			expect(expected).to.be.eq(availableBal)
		})
		after('return to starting state', async () => {
			await spaceibleOffer.connect(seller)
				.editOffer(newOfferID, 0, offer.price, money.address)
		})
	})

	describe('edit second offer', async () => {
		it('at the start, availableBalance should be 0.5 * asset amount', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = asset.balance * 0.5
			expect(expected).to.be.eq(availableBal)
		})
		it('reverts edit if amount > user balance', async () => {
			// edit offer to be bigger than the available balance
			
			// newOffer is currently at 0, available bal is 0.5 * asset amount
			await expect(
				spaceibleOffer.connect(seller)
				.editOffer(newOfferID, asset.balance * 0.5 + 1, offer.price, money.address)
			).to.be.revertedWith('Asset amount accross offers exceeds balance')
		})
		it('availableBalance after revert should not change', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = asset.balance * 0.5
			expect(expected).to.be.eq(availableBal)
		})
		it('does not revert edit if amount <= user balance', async() => {
			// edit offer to be within the available balance
			const tx = await (
				await spaceibleOffer.connect(seller)
				.editOffer(newOfferID, asset.balance * 0.3, offer.price, money.address)).wait()
			expect(tx.status).to.be.eq(1)
		})
		it('returns correct value for availableBalance', async () => {
			const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
			const expected = asset.balance * 0.2
			expect(expected).to.be.eq(availableBal)
		})
	})
})