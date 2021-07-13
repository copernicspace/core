import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[divisibility.test.ts] Divisibility feature test suite', () => {
	let deployer, userA, userB: SignerWithAddress
	before('get signers from hh node', async () =>
		[deployer, userA, userB] = await ethers.getSigners())

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
	// step 1: create a divisible token with weight 100
	// used ID for token: 1
	before('create root asset and get ID of new token', async () =>
		(rootAssetTxr = await assetContract
			.connect(userA)
			.createRoot(true, true, 100)
			.then((tx) => tx.wait())))
	it('created Root Asset successfully', async () =>
		expect(rootAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let rootID: BigNumber
	before('extract new root asset ID from tx receipt event',
		async () => (rootID = getAssetID(rootAssetTxr)))

	it('has correct new root asset ID', async () =>
		expect(rootID).to.be.equal('1'))

	it('has correct weight', async () =>
		expect(await assetContract.getWeight(rootID)).to.be.eq('100'))

	it('can correctly set new weight of asset', async () => {
		await assetContract.connect(userA).setWeight(rootID, 200)
		expect(await assetContract.getWeight(rootID)).to.be.eq('200')
	})

	it('disallows non-owners from setting weight of asset', async () => {
		await expect(
			assetContract.connect(userB).setWeight(rootID, 100)
		).to.be.revertedWith('Not owner')
		await expect(
			assetContract.connect(deployer).setWeight(rootID, 100)
		).to.be.revertedWith('Not owner')
	})

	it('allows to toggle divisibility by asset owner', async () => {
		const firstDivState = await assetContract.isDivisible(rootID)
		expect(firstDivState).to.be.true
		await assetContract.connect(userA).makeNotDivisible(rootID)
		const secondDivState = await assetContract.isDivisible(rootID)
		expect(secondDivState).to.be.false
	})

	it('disallows non-asset-owners to toggle divisibility', async () =>
		await expect(assetContract.connect(userB).makeDivisible(rootID))
			.to.be.revertedWith('Not owner'))

	it('disallows assets with division set to false to be divided', async () =>
		await expect(assetContract.connect(userA).stepDivideInto(rootID, 10, 5))
			.to.be.revertedWith('Asset has divisibility disabled'))

	let childAssetTxr: ContractReceipt
	// used ID for child: 2
	before('create new child asset and get ID of new token', async () =>
		(childAssetTxr = await assetContract
			.connect(userB)
			.create(rootID, true, true, 500)
			.then((tx) => tx.wait())))

	let childID: BigNumber
	before('extract new child asset ID from tx receipt event', async () => {
		(childID = getAssetID(childAssetTxr))
		expect(childID).to.be.eq('2')
	})
		

	it('new child asset has correct weight', async () =>
		expect(await assetContract.getWeight(childID)).to.be.eq('500'))

	let mintedIDs
	// used IDs for divided assets: 3, 4, 5
	it('successfully divides asset with division set to true', async () => {
		await assetContract.connect(userB).makeDivisible(childID)
		const txr = await assetContract
			.connect(userB)
			.stepDivideInto(childID, 3, 75)
			.then(tx => tx.wait())

		const divide = txr.events.filter(events => events.event === 'Divide').pop()
		mintedIDs = divide.args.listOfIDs
		console.log(mintedIDs)
	})

	it('sets correct residual weight in original asset contract', async () => {
		// the weight from the original asset is taken and given to the
		// created divided assets

		// so the sum of weights distributed from the original asset
		// and the residual weight left on the original asset
		// stays the same, equal to the original asset's weight
		rootID = getAssetID(rootAssetTxr)
		const residualWeight = await assetContract.getWeight(childID)
		expect(residualWeight).to.be.eq(500 - 3 * 75)
	})

	it('asserts that total shared weight remains the same', async () => {
		let weightSum: BigNumber
		let currentWeight: BigNumber
		weightSum = BigNumber.from('0')

		// add up the weight of tokens created when asset was divided
		for (const id_ of mintedIDs) {
			currentWeight = BigNumber.from(await assetContract.getWeight(id_))
			weightSum = weightSum.add(currentWeight)
		}

		// add to that the residual weight of the asset
		const childWeight = BigNumber.from(await assetContract.getWeight(childID))
		weightSum = weightSum.add(childWeight)
		expect(weightSum).to.be.eq('500')
	})

	it('sets correct weight of newly created assets', async () => {
		for (const id_ of mintedIDs) {
			expect(await assetContract.getWeight(id_)).to.be.eq('75')
		}
	})

	it('correctly sets newly created tokens parent to the original asset',
		async () => {
			for (const id_ of mintedIDs) {
				expect(await assetContract.divisionOf(id_)).to.be.eq(childID)
			}
		})

	it('correctly set new step size', async() => {
		// set bigger weight for testing
		await assetContract.connect(userA).setWeight(rootID, 2000)
		expect(await assetContract.getWeight(rootID)).to.be.eq('2000')
		// toggle divisibility
		await assetContract.connect(userA).makeDivisible(rootID)
		expect(await assetContract.isDivisible(rootID)).to.be.true

		await assetContract.connect(userA).setMinStepSize(rootID, 100)
		expect(await assetContract.getMinStepSize(rootID)).to.be.eq('100')
	})

	// check if minimal step size & num restriction applies
	it('restricts asset division with minimal step size', async() => {
		await expect(assetContract.connect(userA).batchDivideInto(rootID, ['10', '15'], ['50', '30'])).to.be.revertedWith('Required step size is less than set minimal step size')
		await expect(assetContract.connect(userA).batchDivideInto(rootID, ['0', '5'], ['100', '200'])).to.be.revertedWith('Step number must be positive (non-zero)')
	})

	let joinedBackToken: BigNumber
	it('correctly joins tokens back', async() => {
		const txJoin = await assetContract.connect(userB).joinBack(mintedIDs[2]).then(tx => tx.wait())
		joinedBackToken = txJoin.events.filter(events => events.event === 'joinBackEvent').pop().args._idOfUpdatedAsset
		expect(await assetContract.getWeight(joinedBackToken)).to.be.eq(500 - 2*75)
		expect(await assetContract.getWeight(mintedIDs[2])).to.be.eq('0')

		for(var i=0; i<2; i++) {
			expect(await assetContract.getWeight(mintedIDs[i])).to.be.eq('75')
		}
	})

	it('only allows owner to join back tokens', async() => {
		await expect(assetContract.connect(userA).joinBack(mintedIDs[2])).to.be.revertedWith('Not owner')
	})

	it('does not allow shell tokens to be joined back', async() => {
		await expect(assetContract.connect(userB).joinBack(mintedIDs[2])).to.be.revertedWith('Cannot proceed: token disabled')
	})

	// testing if asset enabled/disabled rule applies
	// to batchDivided tokens
	let createTx, batchDivTx, joinBackTx, joinBackID, newMintIDs
	it('does not allow shell tokens to be joined back after Batch Divide', async() => {
		createTx = await assetContract.connect(userB).createRoot(true, true, '5000').then(tx => tx.wait())
		expect(await getAssetID(createTx)).to.be.eq('6')

		batchDivTx = await assetContract.connect(userB).batchDivideInto(6, ['2', '5'], ['1000', '500']).then(tx => tx.wait())
		newMintIDs = await batchDivTx.events.filter(events => events.event === 'Divide').pop()
		console.log(newMintIDs.args.listOfIDs)
		
		// joining token back:
		joinBackTx = await assetContract.connect(userB).joinBack(13).then(tx => tx.wait())

		// checking if joined back successfully
		joinBackID = joinBackTx.events.filter(events => events.event === 'joinBackEvent').pop().args._idOfUpdatedAsset
		expect(await assetContract.getWeight(joinBackID)).to.be.eq(5000 - (2*1000 + 4*500))
		expect(await assetContract.getWeight('13')).to.be.eq('0')

		// checking if shell token restriction applies
		await expect(assetContract.connect(userB).joinBack('13')).to.be.revertedWith('Cannot proceed: token disabled')
	})
})
