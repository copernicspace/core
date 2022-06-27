import { ContractTransaction } from '@ethersproject/contracts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'
import { setupSpaceibleOffer } from './fixtures/setupOffer.fixture'
import { Balances, balances } from './helpers/balances'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/availableBalance] test set for available balance', () => {
	let asset, offer
	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer
	let deployer, seller: SignerWithAddress
	let money: ERC20Mock
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

    describe('offer creation: insufficient balance revert', async () => {
		// current amount across offers: 132 --> amount available: 10 --> should revert
		it('reverts sell if insufficient available balance', async() =>
			await expect(
				spaceibleOffer.connect(seller)
				.sell(asset.id, asset.balance * 0.5 + 1, offer.price, money.address)
			).to.be.revertedWith('Asset amount accross offers exceeds balance'))

		// should succeed if amount sold within amount available (10)
		it('does not revert sell if total amount within user balance', async() => {
			const tx = await (
				await spaceibleOffer.connect(seller)
				.sell(asset.id, asset.balance * 0.5, offer.price, money.address)).wait()
			expect(tx.status).to.be.eq(1)
		})
	})

    describe('offer edit balance revert test', async() => {
		it('reverts edit if insufficient available balance', async() => {
			// try to edit offer so that the amount is 1 above the available balance
			await expect(
				spaceibleOffer.connect(seller)
				.editOffer(offer.id, asset.balance * 0.5 + 1, offer.price, money.address)
			).to.be.revertedWith('Asset amount accross offers exceeds balance')
		})
		it('does not revert edit if total amount within user balance', async() => {
			// edit offer to be within the available balance
			const tx = await (
				await spaceibleOffer.connect(seller)
				.editOffer(offer.id, asset.balance * 0.5, offer.price, money.address)).wait()
			expect(tx.status).to.be.eq(1)
		})
	})
})