import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import { divisibilityFixtureWithWeight } from './divisibility.fixture'

/*
    General test set for division-oriented operations on divisible tokens
*/

describe('[divisibility-divisionmaking.test.ts]', () => {
	let assetContract: Asset
	let deployer: SignerWithAddress, rootUser: SignerWithAddress, _placeholderUser: SignerWithAddress
	let rootID: BigNumber
	before(
		'load divisibility deploy fixture',
		async () =>
			({ assetContract, deployer, rootUser, rootID } = await waffle.loadFixture(divisibilityFixtureWithWeight))
	)

	let nonRootUser: SignerWithAddress
	before('init signers', async () => ([_placeholderUser, nonRootUser] = await ethers.getSigners()))

	let mintedIDs: BigNumber[]
	it('has correct new root asset ID', async () => expect(rootID).to.be.equal('1'))

	/*

        simple division testing
        > create divisions of one size

    */

	it('[simple] successfully divides asset with division set to true', async () => {
		const txr = await assetContract
			.connect(rootUser)
			.divideInto(rootID, 5, 100)
			.then(tx => tx.wait())

		const divide = txr.events.filter(events => events.event === 'Divide').pop()
		mintedIDs = divide.args.listOfIDs

		expect(mintedIDs.length).to.be.eq(5)

		for (var _id of mintedIDs) {
			expect(await assetContract.getWeight(_id)).to.be.eq('100')
		}
	})

	it('[simple] sets correct weight of newly created assets', async () => {
		for (const id_ of mintedIDs) {
			expect(await assetContract.getWeight(id_)).to.be.eq('100')
		}
	})

	it('[simple] sets correct residual weight in original asset contract', async () => {
		// the weight from the original asset is taken and given to the
		// created divided assets

		// so the sum of weights distributed from the original asset
		// and the residual weight left on the original asset
		// stays the same, equal to the original asset's weight
		const residualWeight = await assetContract.getWeight(rootID)
		expect(residualWeight).to.be.eq(5000 - 5 * 100)
	})

	it('[simple] asserts that total shared weight remains the same', async () => {
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
		expect(weightSum).to.be.eq('5000')
	})

	it('[simple] correctly sets newly created tokens parent to the original asset', async () => {
		for (const id_ of mintedIDs) {
			expect(await assetContract.divisionOf(id_)).to.be.eq(rootID)
		}
	})

	/*

        batch division testing
        > create divisions of many different sizes in one go

    */

	// use batchDivide(...)
	let mintedIDsBatch: BigNumber[]
	it('[batch] successfully batch divides asset with division set to true', async () => {
		const txr = await assetContract
			.connect(rootUser)
			.batchDivideInto(rootID, ['3', '4'], ['300', '200'])
			.then(tx => tx.wait())

		const divide = txr.events.filter(events => events.event === 'Divide').pop()
		mintedIDsBatch = divide.args.listOfIDs

		expect(mintedIDsBatch.length).to.be.eq(7)

		// check the weights
		for (var _id of mintedIDsBatch) {
			if (_id.toBigInt() <= 9) {
				expect(await assetContract.getWeight(_id)).to.be.eq('300')
			} else {
				expect(await assetContract.getWeight(_id)).to.be.eq('200')
			}
		}
	})

	it('[batch] sets correct residual weight in original asset contract', async () => {
		// the weight from the original asset is taken and given to the
		// created divided assets
		// so the sum of weights distributed from the original asset
		// and the residual weight left on the original asset
		// stays the same, equal to the original asset's weight
		const residualWeight = await assetContract.getWeight(rootID)
		expect(residualWeight).to.be.eq(5000 - 5 * 100 - (3 * 300 + 4 * 200))
	})

	it('[batch] asserts that total shared weight remains the same', async () => {
		let weightSum: BigNumber
		let currentWeight: BigNumber
		weightSum = BigNumber.from('0')

		// add up the weight of tokens created when asset was divided
		for (const id_ of mintedIDsBatch) {
			currentWeight = BigNumber.from(await assetContract.getWeight(id_))
			weightSum = weightSum.add(currentWeight)
		}

		// add to that the residual weight of the asset
		const childWeight = BigNumber.from(await assetContract.getWeight(rootID))
		weightSum = weightSum.add(childWeight)
		expect(weightSum).to.be.eq('4500')
	})

	it('[batch] sets correct weight of newly created assets', async () => {
		// for IDs 7, 8, 9 weight should be 300
		for (var i = 7; i <= 9; i++) {
			expect(await assetContract.getWeight(i)).to.be.eq('300')
		}
		// for IDs 10, 11, 12, 13 weight should be 200
		for (var i = 10; i <= 13; i++) {
			expect(await assetContract.getWeight(i)).to.be.eq('200')
		}
	})

	it('[batch] correctly sets newly created tokens parent to the original asset', async () => {
		for (const id_ of mintedIDsBatch) {
			expect(await assetContract.divisionOf(id_)).to.be.eq(rootID)
		}
	})
})
