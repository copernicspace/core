import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { BigNumber } from 'ethers'
import { expect } from 'chai'

import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { setupSpaceibleOffer } from './fixtures/setupOffer.fixture'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/availableBalance] test suite for offer available balance', () => {
	let asset, offer
	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer
	let seller: SignerWithAddress
	let money: ERC20Mock
	let newOfferID
	before(
		'load offer/fixtures/setupOffer',
		async () =>
			({ asset, offer, spaceibleAsset, spaceibleOffer, money, seller } = await loadFixture(setupSpaceibleOffer))
	)

	// asset.balance is 100
	// starting offer.amount is 50 (0.5 * asset.balance)

	describe('offer edit tests', () => {
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
			it('reverts on edit tx, if edit amount > user`s balance', async () => {
				// edit offer to be bigger than the available balance
				await expect(
					spaceibleOffer.connect(seller).editOffer(offer.id, asset.balance + 1, offer.price, money.address)
				).to.be.revertedWith('Asset amount across offers exceeds available balance')
			})
			it('returns correct value for `availableBalance` after revert', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.5
				expect(expected).to.be.eq(availableBal)
			})
			it('does not revert on  edit tx, if amount <= user`s balance', async () =>
				// edit offer to be within the available balance
				await spaceibleOffer
					.connect(seller)
					.editOffer(offer.id, asset.balance, offer.price, money.address)
					.then(tx => tx.wait())
					.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

			it('returns correct value for `availableBalance` after edit tx', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = 0
				expect(expected).to.be.eq(availableBal)
			})
			after('return to starting state', async () => {
				await spaceibleOffer
					.connect(seller)
					.editOffer(offer.id, asset.balance * 0.5, offer.price, money.address)
			})
		})

		describe('create second offer from same seller', async () => {
			// create a new offer with balance being one over the available balance
			it('reverts on sell tx, if insufficient available balance', async () => {
				// try to create new offer so that the amount is 1 above the available balance
				await expect(
					spaceibleOffer.connect(seller).sell(asset.id, asset.balance * 0.5 + 1, offer.price, money.address)
				).to.be.revertedWith('Asset amount across offers exceeds available balance')
			})
			it('returns correct value for availableBalance after reverted tx', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.5
				expect(expected).to.be.eq(availableBal)
			})
			// create a new offer with balance equal to max available
			it('does not revert on sell tx, if total amount within user`s available balance', async () => {
				const tx = await spaceibleOffer
					.connect(seller)
					.sell(asset.id, asset.balance * 0.5, offer.price, money.address)

				newOfferID = await tx.wait().then(txr => getOfferId(txr))
				await expect(tx.wait()).not.to.be.reverted
			})
			it('returns correct value for `availableBalance` after second sell ', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = 0
				expect(expected).to.be.eq(availableBal)
			})
			after('return to starting state', async () => {
				await spaceibleOffer.connect(seller).editOffer(newOfferID, 0, offer.price, money.address)
			})
		})

		describe('edit second offer', async () => {
			it('at the start, `availableBalance` should be 0.5 * `asset.balance`', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.5
				expect(expected).to.be.eq(availableBal)
			})
			it('reverts on edit tx, if amount > user`s available balance', async () => {
				// edit offer to be bigger than the available balance

				// newOffer is currently at 0, available bal is 0.5 * asset amount
				await expect(
					spaceibleOffer
						.connect(seller)
						.editOffer(newOfferID, asset.balance * 0.5 + 1, offer.price, money.address)
				).to.be.revertedWith('Asset amount across offers exceeds available balance')
			})
			it('should not change `availableBalance` after reverted tx', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.5
				expect(expected).to.be.eq(availableBal)
			})
			it('does not revert on edit tx, if amount <= user available balance', async () =>
				// edit offer to be within the available balance
				await spaceibleOffer
					.connect(seller)
					.editOffer(newOfferID, asset.balance * 0.3, offer.price, money.address)
					.then(tx => tx.wait())
					.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

			it('returns correct value for `availableBalance` after edit tx', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.2
				expect(expected).to.be.eq(availableBal)
			})
		})

		describe('edit the first offer after second created', async () => {
			it('at the start, availableBalance should be 0.2 * asset amount', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.2
				expect(expected).to.be.eq(availableBal)
			})
			it('reverts edit tx, if amount > user`s available balance', async () => {
				// edit offer to be bigger than the available balance
				// old offer is currently at 0.5 * asset amount, available bal is 0.2 * asset amount
				await expect(
					spaceibleOffer
						.connect(seller)
						.editOffer(offer.id, asset.balance * 0.7 + 1, offer.price, money.address)
				).to.be.revertedWith('Asset amount across offers exceeds available balance')
			})
			it('should not change `availableBalance` after reverted tx', async () => {
				const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.2
				expect(expected).to.be.eq(availableBal)
			})
			it('changes old offer to have 0.6 * asset amount balance', async () =>
				// edit offer to be bigger than the available balance
				// old offer is currently at 0.5 * assset amount, available bal is 0.2 * asset amount
				await spaceibleOffer
					.connect(seller)
					.editOffer(offer.id, asset.balance * 0.6, offer.price, money.address)
					.then(tx => tx.wait())
					.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

			it('should not change `availableBalance` after reverted edit tx', async () => {
				const actual = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = asset.balance * 0.1
				expect(expected).to.be.eq(actual)
			})
		})
	})

	describe('offer buy tests', async () => {
		let buyer: SignerWithAddress
		let buyPrice: number
		before('set buy price', async () => (buyPrice = offer.price.mul(asset.balance)))
		before('get buyer', async () => ([, , buyer] = await ethers.getSigners()))
		before('mint mock money to buyer', async () => await money.mintTo(buyer.address, buyPrice))
		before('set money allowance', async () => await money.connect(buyer).approve(spaceibleOffer.address, buyPrice))

		describe('buy the first offer', async () => {
			/*
			x = asset.balance

			at the start (before buy):
				availableBalance = 0.1 * x
				amount on offer = 0.6 * x

			after buy:
				availableBalance = 0.1 * x
				amount on offer = 0 (all sold)

			after edit (effectively: sell half of remaining):
				availableBalance = 0.05 * x
				amount on offer = 0.05 * x

			after second buy:
				availableBalance = 0.05 * x
				amount on offer = 0
		*/
			it('should not change available balance, after `buy` tx', async () => {
				const startAval = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				await spaceibleOffer.connect(buyer).buy(offer.id, asset.balance * 0.6)
				const endAval = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				expect(endAval).to.be.eq(startAval)
				/*
				this ^ is because both, the amount across offers, and user's balance,
				decrease by the same amount -- offerBuyAmount,  so their difference 
				stays the same, equaling the value before the transaction
			*/
			})
			it('should not revert on edit tx, after buy tx', async () =>
				await spaceibleOffer
					.connect(seller)
					.editOffer(offer.id, asset.balance * 0.05, offer.price, money.address)
					.then(tx => tx.wait())
					.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

			it('has 0.05 * asset.balance availableBalance after edit tx', async () => {
				const actual = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
				const expected = 0.05 * asset.balance
				expect(expected).to.be.eq(actual)
			})
			it('can buy offer after it has been 1) sold and 2) edited', async () => {
				const startBal = await spaceibleAsset.balanceOf(buyer.address, asset.id)

				// buy with `buyer`
				const buyAmount = asset.balance * 0.05
				await spaceibleOffer.connect(buyer).buy(offer.id, buyAmount)

				const endBal = await spaceibleAsset.balanceOf(buyer.address, asset.id)
				expect(endBal).to.be.eq(startBal.add(buyAmount))
			})
			it('has zero remaining balance on offer after buy tx', async () => {
				const fetchedOffer = await spaceibleOffer.getOffer(offer.id)
				expect(fetchedOffer.amount).to.be.eq('0')
			})

			let buyer2: SignerWithAddress
			before('get buyer2', async () => ([, , , buyer2] = await ethers.getSigners()))
			const newOffer = {
				id: undefined, // initialize after sell tx
				amount: undefined,
				price: undefined
			}
			before('setup newOffer', async () => {
				newOffer.amount = asset.balance * 0.05
				newOffer.price = offer.price
			})
			before(
				'approve buyer for all',
				async () => await spaceibleAsset.connect(buyer).setApprovalForAll(spaceibleOffer.address, true)
			)

			describe('sell offer to second user & buy', async () => {
				/*
					x = asset.balance

					after the first series of tests, account: `seller` (creator of asset)
					has 0.05 * x availableBalance left

					in a series of 2 transactions, 0.65 * x balance has been transfered to `buyer`

					in a further sell transaction in this test, 0.05 * x of that balance
					will then be sold from `buyer` to `buyer2`

					the purpose is to test that the original creator of asset - `seller` - 
					does not have their availableBalance modified during resell

					overall asset balance transaction flow:
					seller --> buyer --> buyer2
									  ^
					(checking if    this   transaction modifies availableBalance of `seller`)
				*/

				/*
					NOTE:

					availableBalance 		--> changes after `sell` or `edit` transaction
					balanceOf 				--> changes after `buy` transaction
				*/
				// available balances
				describe('check availableBalance on accounts', async () => {
					it('should have 0.05 * asset.bal on seller', async () => {
						const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
						const expected = asset.balance * 0.05
						expect(expected).to.be.eq(availableBal)
					})
					it('should have 0.65 * asset.bal on buyer', async () => {
						const availableBal = await spaceibleOffer.getAvailableBalance(buyer.address, asset.id)
						const expected = asset.balance * (0.05 + 0.6) // buyer bought 0.6 and then 0.05
						expect(expected).to.be.eq(availableBal)
					})
					it('should have 0 on buyer2', async () => {
						const availableBal = await spaceibleOffer.getAvailableBalance(buyer2.address, asset.id)
						const expected = 0
						expect(expected).to.be.eq(availableBal)
					})
				})
				// actual balances
				describe('check balance on accounts', async () => {
					// all of asset.balance should be on seller & buyer
					// because no transfer has yet been made to `buyer2`
					it('should have 0.35 * asset.bal on seller', async () => {
						const availableBal = await spaceibleAsset.balanceOf(seller.address, asset.id)
						const expected = asset.balance * (0.3 + 0.05)
						// two buy transactions, see: lines 212 and 238 (0.6 and 0.05)
						expect(expected).to.be.eq(availableBal)
					})
					it('should have 0.65 * asset.bal on buyer', async () => {
						const availableBal = await spaceibleAsset.balanceOf(buyer.address, asset.id)
						const expected = asset.balance * (0.05 + 0.6) 
						// offer not yet created --> availableBalance = balance
						expect(expected).to.be.eq(availableBal)
					})
					it('should have 0 on buyer2', async () => {
						const availableBal = await spaceibleAsset.balanceOf(buyer2.address, asset.id)
						const expected = 0
						expect(expected).to.be.eq(availableBal)
					})
				})

				describe('test: create new offer with non-asset-creator', async () => {
					before('create new offer', async () => {
						await spaceibleOffer
							.connect(buyer)
							.sell(asset.id, newOffer.amount, newOffer.price, money.address)
							.then(tx => tx.wait())
							.then(txr => (newOffer.id = getOfferId(txr)))
					})
					it('should create offer with 0.05 * asset.bal', async () => {
						const fetchedOffer = await spaceibleOffer.getOffer(newOffer.id)
						expect(fetchedOffer.amount).to.be.eq(BigNumber.from(0.05 * asset.balance))
					})

					// --- availableBalance ---
					it('should have 0.6 * asset.bal availableBalance on buyer', async () => {
						// creation of offer reduced availableBalance by 0.05 * asset.balance
						const availableBal = await spaceibleOffer.getAvailableBalance(buyer.address, asset.id)
						const expected = 0.6 * asset.balance
						expect(expected).to.be.eq(availableBal)
					})
					it('should have 0 availableBalance on buyer2', async () => {
						// `buyer2` has not yet bought the offer -- availableBalance unchanged
						const availableBal = await spaceibleOffer.getAvailableBalance(buyer2.address, asset.id)
						const expected = 0
						expect(expected).to.be.eq(availableBal)
					})

					// --- Actual asset balance ---
					it('should have 0.65 * asset.bal balance on buyer before sell tx', async () => {
						// NOTE: we're checking actual balance, NOT availableBalance
						const actualBal = await spaceibleAsset.balanceOf(buyer.address, asset.id)
						const expected = 0.65 * asset.balance
						expect(expected).to.be.eq(actualBal)
					})
					it('should have 0 balance on buyer2', async () => {
						// NOTE: we're checking actual balance, NOT availableBalance
						const actualBal = await spaceibleAsset.balanceOf(buyer2.address, asset.id)
						const expected = 0
						expect(expected).to.be.eq(actualBal)
					})
				})

				describe('test: buy offer from non-asset-creator', async () => {
					before('mint mock money to buyer', async () => await money.mintTo(buyer2.address, buyPrice))
					before(
						'set money allowance',
						async () => await money.connect(buyer2).approve(spaceibleOffer.address, buyPrice)
					)
					before('buy with buyer2', async () => {
						await spaceibleOffer.connect(buyer2).buy(newOffer.id, newOffer.amount)
					})

					it('has zero remaining balance on offer after buy tx', async () => {
						const fetchedOffer = await spaceibleOffer.getOffer(newOffer.id)
						expect(fetchedOffer.amount).to.be.eq('0')
					})

					// --- availableBalance ---
					it('availableBalance on seller should not change', async () => {
						// asset creator should NOT have their availableBalance changed after resell down the line
						const availableBal = await spaceibleOffer.getAvailableBalance(seller.address, asset.id)
						const expected = 0.05 * asset.balance
						expect(expected).to.be.eq(availableBal)
					})
					it('availableBalance on buyer should not change', async () => {
						// account: buyer has not bought or sold any balance after offer creation
						// 			and subsequent buy by `buyer2` -- availableBal should not change
						const availableBal = await spaceibleOffer.getAvailableBalance(buyer.address, asset.id)
						const expected = 0.6 * asset.balance
						expect(expected).to.be.eq(availableBal)
					})
					it('should have 0.5 * asset.balance availableBalance on buyer2', async () => {
						// after buy, `buyer2` availableBalance should increase by 0.05 * asset.balance
						const availableBal = await spaceibleOffer.getAvailableBalance(buyer2.address, asset.id)
						const expected = 0.05 * asset.balance
						expect(expected).to.be.eq(availableBal)
					})

					// --- Actual asset balance ---
					it('should have 0.6 * asset.bal balance on buyer after sell tx', async () => {
						// NOTE: we're checking actual balance, NOT availableBalance
						const actualBal = await spaceibleAsset.balanceOf(buyer.address, asset.id)
						const expected = 0.6 * asset.balance
						expect(expected).to.be.eq(actualBal)
					})
					it('should have 0.05 * asset.bal balance on buyer2', async () => {
						// NOTE: we're checking actual balance, NOT availableBalance
						const actualBal = await spaceibleAsset.balanceOf(buyer2.address, asset.id)
						const expected = 0.05 * asset.balance
						expect(expected).to.be.eq(actualBal)
					})
				})
			})
		})
	})
})
