import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset, Market } from '../../../typechain'
import { ERC20Mock } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { getSellID } from '../../helpers/sell-id.helper'

describe('[resell-royalties.test.ts] Resell royalties feature set test', () => {
	let deployer, user1, user2, user3, user4, user5: SignerWithAddress
	before(
		'get signers from hh node',
		async () => ([deployer, user1, user2, user3, user4, user5] = await ethers.getSigners())
	)

	let assetContract: Asset
	before(
		'deploy asset contract',
		async () =>
			(assetContract = await ethers
				.getContractFactory('Asset')
				.then(factory => factory.connect(deployer).deploy('TEST-URI'))
				.then(contract => contract.deployed())
				.then(deployedContract => deployedContract as Asset))
	)

	it('deployed the asset contract successfully', async () =>
		await assetContract.deployTransaction.wait().then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	let rootAssetTxr: ContractReceipt

	// step 1: create the Lunar Outpost token
	before(
		'create root asset and get ID of new token',
		async () =>
			(rootAssetTxr = await assetContract
				.connect(user1)
				.createRoot(true, true, 3500)
				.then(tx => tx.wait()))
	)

	// check if deployed successfully & all parameters correct
	it('created root asset successfully', async () => expect(rootAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let rootID: BigNumber
	before('extract asset ID', async () => (rootID = getAssetID(rootAssetTxr)))

	it('set correct new asset ID', async () => expect(rootID).to.be.equal('1'))

	// step 4: create offer for assets
	let marketContract: Market
	// prepare market
	before('deploy market contract', async () => {
		marketContract = await ethers
			.getContractFactory('Market')
			.then(factory => factory.connect(deployer).deploy(assetContract.address))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as Market)
	})
	let users: SignerWithAddress[]
	before('wrap users into a list', async () => {
		users = [user1, user2, user3, user4, user5]
	})
	before('approve market for each user', async () => {
		for (var i = 0; i < users.length; i++) {
			await assetContract.connect(users[i]).setApprovalForAll(marketContract.address, true)
		}
	})
	let money: ERC20Mock
	const sellPrice = 100000
	before('prepare mock money', async () => {
		money = await ethers
			.getContractFactory('ERC20Mock')
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})
	before('transfer money to users', async () => {
		for (var i = 1; i < users.length; i++) {
			await money.mintTo(await users[i].address, sellPrice)
		}
	})
	// create sell offer
	let sellTxr
	let assetForSale_

	/*
		Description:
		users [2, 3, 4] start with a balance of 100.000
		user 1 starts with 0 balance

		user 1 sells asset to user 2
			* without royalties

		user 2 buys the asset for 100.000 -> transfer 100.000 to user1

		user 2 sells asset to user 3
			* with 10% royalty

		user 3 buys the asset for 100.000 -> transfer 100.000 to user2

		user 3 sells the asset for 100.000 to user 3
			* cannot sell with royalties (restricted to one-level)
			* can sell normally (without royalties)

		user 3 buys the asset for 100.000 -> transfer 10% of 100.000 to user2 and 90% to user3

		all further sale of asset will transfer a percentage of revenue from sale (equal to % of resell royalty)
		to the previous asset owner who sold the asset with royalties, and the rest to seller

	*/

	assetForSale_ = BigNumber.from('1')
	it('can freely be sold without asset royalties', async () => {
		// user1 is a seller

		// create sell offers
		sellTxr = await marketContract
			.connect(user1)
			.sell(assetForSale_, sellPrice, money.address)
			.then(tx => tx.wait())

		// check if smart offers added correctly
		const sell = sellTxr.events.filter(events => events.event === 'NewSmartOffer').pop()
		expect(sell.args.seller).to.be.eq(user1.address)
		expect(sell.args.what).to.be.eq(assetForSale_)
		expect(sell.args.price).to.be.eq(sellPrice)
		expect(sell.args).to.have.property('money', money.address)
		expect(sell.args.price).to.be.eq(sellPrice)
	})
	it('can freely be bought without asset royalties', async () => {
		// user2 is a buyer

		const approveTrx = await money
			.connect(user2)
			.approve(marketContract.address, sellPrice)
			.then(tx => tx.wait())

		const approve = approveTrx.events.filter(events => events.event === 'Approval').pop()

		expect(approve.args.owner).to.be.eq(user2.address)
		expect(approve.args.spender).to.be.eq(marketContract.address)
		expect(approve.args.value).to.be.eq(sellPrice)

		const buyTxr1 = await marketContract
			.connect(user2)
			.buy('0')
			.then(tx => tx.wait())

		expect(await assetContract.balanceOf(user1.address, assetForSale_)).to.be.eq('0')
		expect(await assetContract.balanceOf(user2.address, assetForSale_)).to.be.eq('1')

		// check if money transferred successfully
		expect(await money.balanceOf(user1.address)).to.be.eq(sellPrice)
		expect(await money.balanceOf(user2.address)).to.be.eq('0')
	})
	it('cannot be sold with royalties by non-owner', async () => {
		await expect(
			marketContract.connect(user1).sellWithRoyalties(assetForSale_, sellPrice, money.address, '10000000')
		).to.be.revertedWith('Failed to create new sell, insuffucient balance')
	})
	it('can sell asset with royalties', async () => {
		// user2 is a seller

		// create sell offers
		sellTxr = await marketContract
			.connect(user2)
			.sellWithRoyalties(assetForSale_, sellPrice, money.address, '10000000')
			.then(tx => tx.wait())

		// check if smart offers added correctly
		const sell = sellTxr.events.filter(events => events.event === 'NewSmartOffer').pop()
		expect(sell.args.seller).to.be.eq(user2.address)
		expect(sell.args.what).to.be.eq(assetForSale_)
		expect(sell.args.price).to.be.eq(sellPrice)
		expect(sell.args).to.have.property('money', money.address)
		expect(sell.args.price).to.be.eq(sellPrice)
	})
	it('corectly distributes funds after buy', async () => {
		// user3 is a buyer

		const approveTrx = await money
			.connect(user3)
			.approve(marketContract.address, sellPrice)
			.then(tx => tx.wait())

		const approve = approveTrx.events.filter(events => events.event === 'Approval').pop()

		expect(approve.args.owner).to.be.eq(user3.address)
		expect(approve.args.spender).to.be.eq(marketContract.address)
		expect(approve.args.value).to.be.eq(sellPrice)

		const buyTxr1 = await marketContract
			.connect(user3)
			.buy('1')
			.then(tx => tx.wait())

		expect(await assetContract.balanceOf(user2.address, assetForSale_)).to.be.eq('0')
		expect(await assetContract.balanceOf(user3.address, assetForSale_)).to.be.eq('1')

		// check if money transferred successfully
		expect(await money.balanceOf(user2.address)).to.be.eq(sellPrice)
		expect(await money.balanceOf(user3.address)).to.be.eq('0')
	})
	it('can resell asset with royalties', async () => {
		// user3 is a seller

		// create sell offers
		sellTxr = await marketContract
			.connect(user3)
			.sell(assetForSale_, sellPrice, money.address)
			.then(tx => tx.wait())

		// check if smart offers added correctly
		const sell = sellTxr.events.filter(events => events.event === 'NewSmartOffer').pop()
		expect(sell.args.seller).to.be.eq(user3.address)
		expect(sell.args.what).to.be.eq(assetForSale_)
		expect(sell.args.price).to.be.eq(sellPrice)
		expect(sell.args).to.have.property('money', money.address)
		expect(sell.args.price).to.be.eq(sellPrice)
	})
	it('corectly distributes funds after buy with resale', async () => {
		// user4 is a buyer

		const approveTrx = await money
			.connect(user4)
			.approve(marketContract.address, sellPrice)
			.then(tx => tx.wait())

		const approve = approveTrx.events.filter(events => events.event === 'Approval').pop()

		expect(approve.args.owner).to.be.eq(user4.address)
		expect(approve.args.spender).to.be.eq(marketContract.address)
		expect(approve.args.value).to.be.eq(sellPrice)

		const buyTxr1 = await marketContract
			.connect(user4)
			.buy('2')
			.then(tx => tx.wait())

		expect(await assetContract.balanceOf(user3.address, assetForSale_)).to.be.eq('0')
		expect(await assetContract.balanceOf(user4.address, assetForSale_)).to.be.eq('1')

		// check if money transferred successfully
		expect(await money.balanceOf(user2.address)).to.be.eq('110000')
		expect(await money.balanceOf(user3.address)).to.be.eq('90000')
		expect(await money.balanceOf(user4.address)).to.be.eq('0')
	})
	it('can continue to sell assets, without royalties', async() => {
		// user4 is a seller

		// create sell offers
		sellTxr = await marketContract
			.connect(user4)
			.sell(assetForSale_, sellPrice, money.address)
			.then(tx => tx.wait())

		// check if smart offers added correctly
		const sell = sellTxr.events.filter(events => events.event === 'NewSmartOffer').pop()
		expect(sell.args.seller).to.be.eq(user4.address)
		expect(sell.args.what).to.be.eq(assetForSale_)
		expect(sell.args.price).to.be.eq(sellPrice)
		expect(sell.args).to.have.property('money', money.address)
		expect(sell.args.price).to.be.eq(sellPrice)
	})
	it('can continue to buy assets, with preserved royalties', async() => {
		// user5 is a buyer

		const approveTrx = await money
			.connect(user5)
			.approve(marketContract.address, sellPrice)
			.then(tx => tx.wait())

		const approve = approveTrx.events.filter(events => events.event === 'Approval').pop()

		expect(approve.args.owner).to.be.eq(user5.address)
		expect(approve.args.spender).to.be.eq(marketContract.address)
		expect(approve.args.value).to.be.eq(sellPrice)

		const buyTxr1 = await marketContract
			.connect(user5)
			.buy('3')
			.then(tx => tx.wait())

		expect(await assetContract.balanceOf(user4.address, assetForSale_)).to.be.eq('0')
		expect(await assetContract.balanceOf(user5.address, assetForSale_)).to.be.eq('1')

		// check if money transferred successfully
		expect(await money.balanceOf(user2.address)).to.be.eq('120000')
		expect(await money.balanceOf(user3.address)).to.be.eq('90000')
		expect(await money.balanceOf(user3.address)).to.be.eq('90000')
		expect(await money.balanceOf(user5.address)).to.be.eq('0')
	})
})
