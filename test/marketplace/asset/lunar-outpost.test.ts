import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset, Market } from '../../../typechain'
import { ERC20Mock } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[lunar-outpost.test.ts] Lunar Outpost Use Case Test', () => {

	/*
		Contract Factory set-up
	*/

    let deployer, tokenCreator: SignerWithAddress
    before('get signers from hh node', async () =>
		[deployer, tokenCreator] = await ethers.getSigners())
    
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
		await expect(assetContract.connect(tokenCreator).stepDivideInto(rootID, 10, 50)).to.be.revertedWith('Required step size is less than set minimal step size')
		await expect(assetContract.connect(tokenCreator).stepDivideInto(rootID, 0, 100)).to.be.revertedWith('Step number must be positive (non-zero)')
	})

	// step 3: divide into 5 tokens of sizes [200, 200, 500, 500, 1000] and modify original token to have residual weight [1100]
	let mintedIDs1, mintedIDs2, mintedIDs3
	it('correctly divides asset', async() => {
		const txr1 = await assetContract.connect(tokenCreator).stepDivideInto(rootID, 2, 200).then(tx => tx.wait())
		const txr2 = await assetContract.connect(tokenCreator).stepDivideInto(rootID, 2, 500).then(tx => tx.wait())
		const txr3 = await assetContract.connect(tokenCreator).stepDivideInto(rootID, 1, 1000).then(tx => tx.wait())

		const divide1 = txr1.events.filter(events => events.event === 'Divide').pop()
		const divide2 = txr2.events.filter(events => events.event === 'Divide').pop()
		const divide3 = txr3.events.filter(events => events.event === 'Divide').pop()

		mintedIDs1 = divide1.args.listOfIDs
		mintedIDs2 = divide2.args.listOfIDs
		mintedIDs3 = divide3.args.listOfIDs

	})

	// check if division correct
	it('sets correct weight of newly created assets', async () => {
		for (const id_ of mintedIDs1) {
			expect(await assetContract.getWeight(id_)).to.be.eq('200')
		}
		for (const id_ of mintedIDs2) {
			expect(await assetContract.getWeight(id_)).to.be.eq('500')
		}
		for (const id_ of mintedIDs3) {
			expect(await assetContract.getWeight(id_)).to.be.eq('1000')
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
			for (const id_ of mintedIDs1 && mintedIDs2 && mintedIDs3) {
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
	})
	before('approve market', async() => {
		await assetContract.connect(deployer).setApprovalForAll(marketContract.address, true)
	})
	let money
	before('prepare mock money', async() => {
		money = await ethers
			.getContractFactory('ERC20Mock')
			.then((factory) => factory.connect(deployer).deploy())
			.then((contract) => contract.deployed())
			.then((deployedContract) => deployedContract as ERC20Mock)
	})
	// create sell offer
	const sellPrice = 5000
	let sellTxr
	before('create sell offer', async() => {
		sellTxr = await marketContract.connect(tokenCreator).sell(rootID, sellPrice, money.address)
	})
})
