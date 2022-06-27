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
import { Balances, balances } from './helpers/balances'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/availableBalance] test set for available balance', () => {
	let deployer: SignerWithAddress

	let spaceibleAsset: SpaceibleAsset
	let spaceibleOffer: SpaceibleOffer

	let seller: SignerWithAddress
	let buyer: SignerWithAddress

	let money: ERC20Mock
	let moneyDecimals: number

	let buyTx: ContractTransaction

	before(
		'load offer/fixtures/deploy',
		async () => ({ deployer, spaceibleAsset, spaceibleOffer } = await loadFixture(deploySpaceibleOffer))
	)

    before('load seller and buyer signers', async () => ([, seller, buyer] = await ethers.getSigners()))

	before('deploy ERC20 Mock', async () => {
		money = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)

		moneyDecimals = await money.decimals()
	})

	const bps = 10000
	const operatorFee = 300

	const asset = {
		id: undefined, // initialize after mint tx
		cid: 'test-buy-tx',
		balance: 100,
		royalties: 0,
		data: '0x'
	}

	before(
		'grant creator role to user',
		async () => await spaceibleAsset.connect(deployer).grantCreatorRole(seller.address)
	)

	before(
		'mint asset as seller and assign id',
		async () =>
			await spaceibleAsset
				.connect(seller)
				.mint(asset.cid, asset.balance, asset.royalties, asset.data)
				.then(tx => tx.wait())
				.then(txr => (asset.id = getAssetID(txr)))
	)

	const offer = {
		id: undefined, // initialize after sell tx
		amount: asset.balance * 0.5, // sell max balance
		price: parseUnits('100', moneyDecimals)
	}

	before(
		'approve for all as seller',
		async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
	)

	before(
		'create new offer as seller',
		async () =>
			await spaceibleOffer
				.connect(seller)
				.sell(asset.id, offer.amount, offer.price, money.address)
				.then(tx => tx.wait())
				.then(txr => (offer.id = getOfferId(txr)))
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