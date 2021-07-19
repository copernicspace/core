import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset, Market } from '../../../typechain'
import { ERC20Mock } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { getSellID } from '../../helpers/sell-id.helper'

describe('[lunar-outpost.test.ts] Lunar Outpost Use Case Test', () => {

	/*
		Contract Factory set-up
	*/

    let deployer, tokenCreator, tokenBuyer: SignerWithAddress
    before('get signers from hh node', async () =>
		[deployer, tokenCreator, tokenBuyer] = await ethers.getSigners())
    
    let assetContract: Asset
    before('deploy asset contract', async () =>
		assetContract = await ethers
			.getContractFactory('Asset')
			.then((factory) => factory.connect(deployer).deploy('TEST-URI'))
			.then((contract) => contract.deployed())
			.then((deployedContract) => deployedContract as Asset))

	it('deployed the asset contract successfully', async () =>
		await assetContract.deployTransaction
			.wait()
			.then((txr) =>
				expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
			))

	let rootAssetTxr: ContractReceipt

    /*

        Lunar Outpost Payload Use Case Tests

        Token represents payload space for a lunar lander mission
        Token Weight represents available payload mass

		Minimal mass per token: 100 (g)
		Total available mass:	3500 (g)

    */

	// step 1: create the Lunar Outpost token
	before('create root asset and get ID of new token', async () =>
		(rootAssetTxr = await assetContract
			// created by lunar outpost user
			.connect(tokenCreator)
			// public, divisible, total weight 3500
			.createRoot(true, true, 3500)
			// get tx
			.then((tx) => tx.wait())))

	// check if deployed successfully & all parameters correct
	it('created Lunar Outpost Asset successfully', async () =>
		expect(rootAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let rootID: BigNumber
	before('extract new Lunar Outpost asset ID from tx receipt event',
		async () => (rootID = getAssetID(rootAssetTxr)))

	it('set correct new asset ID', async () =>
		expect(rootID).to.be.equal('1'))

	it('set correct weight', async () =>
		expect(await assetContract.getWeight(rootID)).to.be.eq('3500'))

	it('defaulted minimum step size to 0', async () =>
		expect(await assetContract.getMinStepSize(rootID)).to.be.eq('0'))

	// step 2: adjust minimal step size to 100
	it('correctly set new step size', async() => {
		await assetContract.connect(tokenCreator).setMinStepSize(rootID, 100)
		expect(await assetContract.getMinStepSize(rootID)).to.be.eq('100')
	})

	// check if minimal step size & num restriction applies
	it('restricts asset division with minimal step size', async() => {
		await expect(assetContract.connect(tokenCreator).batchDivideInto(rootID, ['10', '15'], ['50', '30'])).to.be.revertedWith('Required step size is less than set minimal step size')
		await expect(assetContract.connect(tokenCreator).batchDivideInto(rootID, ['0', '5'], ['100', '500'])).to.be.revertedWith('Step number must be positive (non-zero)')
	})

	// step 3: divide into 5 tokens of sizes [200, 200, 500, 500, 1000] and modify original token to have residual weight [1100]
	let mintedIDs
	it('correctly divides asset', async() => {

		const txr = await assetContract.connect(tokenCreator).batchDivideInto(rootID, ['2','2','1'], ['200','500', '1000']).then(tx => tx.wait())
		const divide = txr.events.filter(events => events.event === 'Divide').pop()
		mintedIDs = divide.args.listOfIDs

	})

	// check if division correct
	it('sets correct weight of newly created assets', async () => {

		console.log(mintedIDs)
		for(var i=0; i<mintedIDs.length; i++) {
			if(i < 2) {
				expect(await assetContract.getWeight(mintedIDs[i])).to.be.eq('200')
			} else if (i < 4) {
				expect(await assetContract.getWeight(mintedIDs[i])).to.be.eq('500')
			} else {
				expect(await assetContract.getWeight(mintedIDs[i])).to.be.eq('1000')
			}
		}
	})

	it('sets correct residual weight in original asset contract', async () => {
		// the weight from the original asset is taken and given to the
		// created divided assets

		// so the sum of weights distributed from the original asset
		// and the residual weight left on the original asset
		// stays the same, equal to the original asset's weight
		rootID = getAssetID(rootAssetTxr)
		const residualWeight = await assetContract.getWeight(rootID)
		expect(residualWeight).to.be.eq(3500 - (200*2 + 500*2 + 1000))
		expect(residualWeight).to.be.eq(1100)
	})

	it('correctly sets newly created tokens parent to the original asset',
		async () => {
			for (const id_ of mintedIDs) {
				expect(await assetContract.divisionOf(id_)).to.be.eq(rootID)
			}
		})

	// step 4: create offer for assets
	let marketContract: Market
	// prepare market
	before('deploy market contract', async() => {
		marketContract = await ethers
			.getContractFactory('Market')
			.then((factory) => factory.connect(deployer).deploy(assetContract.address))
			.then((contract) => contract.deployed())
			.then((deployedContract) => deployedContract as Market)

		await assetContract.connect(tokenCreator).setApprovalForAll(marketContract.address, true)
	})
	before('approve market', async() => {
		await assetContract.connect(deployer).setApprovalForAll(marketContract.address, true)
	})
	let money: ERC20Mock
	const sellPrice = 100000
	before('prepare mock money', async() => {
		money = await ethers
			.getContractFactory('ERC20Mock')
			.then((factory) => factory.connect(deployer).deploy())
			.then((contract) => contract.deployed())
			.then((deployedContract) => deployedContract as ERC20Mock)
	})
	before('transfer money', async() => {
		await money.mintTo(tokenBuyer.address, 300000)
	})
	// create sell offer
	let sellTxr1, sellTxr2
	let assetForSale1
	let assetForSale2 
	it('carried out sell transaction successfully', async () => {
		// create sell offers
		assetForSale1 = await mintedIDs[0] // asset of weight 200
		assetForSale2 = await mintedIDs[2] // asset of weight 500
		sellTxr1 = await marketContract.connect(tokenCreator).sell(assetForSale1, sellPrice, money.address).then(tx => tx.wait())
		sellTxr2 = await marketContract.connect(tokenCreator).sell(assetForSale2, sellPrice, money.address).then(tx => tx.wait())

		// check if smart offers added correctly
		const sell1 = sellTxr1.events.filter(events => events.event === 'NewSmartOffer').pop()
		expect(sell1.args.seller).to.be.eq(tokenCreator.address)
		expect(sell1.args.what).to.be.eq(assetForSale1)
		expect(sell1.args.price).to.be.eq(sellPrice)
		expect(sell1.args.sellID).to.be.eq('0')
		expect(sell1.args).to.have.property('money', money.address)

		const sell2 = sellTxr2.events.filter(events => events.event === 'NewSmartOffer').pop()
		expect(sell2.args.seller).to.be.eq(tokenCreator.address)
		expect(sell2.args.what).to.be.eq(assetForSale2)
		expect(sell2.args.price).to.be.eq(sellPrice)
		expect(sell2.args.sellID).to.be.eq('1')
		expect(sell2.args).to.have.property('money', money.address)
	})
	it('sets correct balance of seller after smart offer created', async () => {
		expect(await assetContract.balanceOf(tokenCreator.address, assetForSale1)).to.be.eq('1')
		expect(await assetContract.balanceOf(tokenCreator.address, assetForSale2)).to.be.eq('1')
	})	
	it('carries out buy transaction successfully', async () => {
		let approveTrx = await money.connect(tokenBuyer).approve(
			marketContract.address,
			sellPrice*3
		).then(tx => tx.wait())

		const approve1 = approveTrx.events.filter(events => events.event === 'Approval').pop()
		
		expect(approve1.args.owner).to.be.eq(tokenBuyer.address)
		expect(approve1.args.spender).to.be.eq(marketContract.address)
		expect(approve1.args.value).to.be.eq(sellPrice*3)

		const buyTxr1 = await marketContract.connect(tokenBuyer).buy('0').then(tx => tx.wait())
		const sellID1 = await getSellID(buyTxr1)

		expect(sellID1).to.be.eq(0)

		const buyTxr2 = await marketContract.connect(tokenBuyer).buy('1').then(tx => tx.wait())
		const sellID2 = await getSellID(buyTxr2)

		expect(sellID2).to.be.eq(1)

		expect(
			await assetContract.balanceOf(tokenCreator.address, assetForSale1)
		).to.be.eq('0')
		expect(
			await assetContract.balanceOf(tokenBuyer.address, assetForSale1)
		).to.be.eq('1')

		expect(
			await assetContract.balanceOf(tokenCreator.address, assetForSale2)
		).to.be.eq('0')
		expect(
			await assetContract.balanceOf(tokenBuyer.address, assetForSale2)
		).to.be.eq('1')

	})
	it('correctly transfers money after buy transaction', async() => {
		expect(await money.balanceOf(tokenBuyer.address)).to.be.eq(300000 - 2*sellPrice) // token buyer had 300.000 money and then spent 2*100.000
        expect(await money.balanceOf(tokenCreator.address)).to.be.eq(sellPrice*2)
	})

})
