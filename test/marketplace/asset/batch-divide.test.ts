/*
    Dedicated testing for batchDivideInto(...)

*/

import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[batch-divide.test.ts] Divisibility feature test suite', () => {
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
	// step 1: create a divisible token with weight 1000
	before('create root asset and get ID of new token', async () =>
		(rootAssetTxr = await assetContract
			.connect(userA)
			.createRoot(true, true, 1000)
			.then((tx) => tx.wait())))
	it('created Root Asset successfully', async () =>
		expect(rootAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let rootID: BigNumber
	before('extract new root asset ID from tx receipt event',
		async () => (rootID = getAssetID(rootAssetTxr)))

	it('has correct new root asset ID', async () =>
		expect(rootID).to.be.equal('1'))

	it('has correct weight', async () =>
		expect(await assetContract.getWeight(rootID)).to.be.eq('1000'))

	it('can correctly set new weight of asset', async () => {
		await assetContract.connect(userA).setWeight(rootID, 2000)
		expect(await assetContract.getWeight(rootID)).to.be.eq('2000')
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

	let mintedIDs

	// use batchDivide(...)
	it('successfully divides asset with division set to true', async () => {
		await assetContract.connect(userA).makeDivisible(rootID)
		const txr = await assetContract
			.connect(userA)
			.batchDivideInto(rootID, ['3', '4'], ['300', '200'])
			.then(tx => tx.wait())

		const divide = txr.events.filter(events => events.event === 'Divide').pop()
		mintedIDs = divide.args.listOfIDs
		console.log(mintedIDs)

		// check the weights
		for (let i = mintedIDs[0]; i <= mintedIDs[6]; i++) {
			console.log('id: ' + i + ', weight: ' + await assetContract.getWeight(BigNumber.from(i)))
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
		expect(residualWeight).to.be.eq(2000 - (3 * 300 + 4 * 200))
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
		const childWeight = BigNumber.from(await assetContract.getWeight(rootID))
		weightSum = weightSum.add(childWeight)
		expect(weightSum).to.be.eq('2000')
	})

	it('sets correct weight of newly created assets', async () => {
		for (var i = mintedIDs[0]; i <= mintedIDs[2]; i++) {
			expect(await assetContract.getWeight(i)).to.be.eq('300')
		}
		for (var i = mintedIDs[3]; i <= mintedIDs[6]; i++) {
			expect(await assetContract.getWeight(i)).to.be.eq('200')
		}
	})

	it('correctly sets newly created tokens parent to the original asset',
		async () => {
			for (const id_ of mintedIDs) {
				expect(await assetContract.divisionOf(id_)).to.be.eq(rootID)
			}
		})
})
