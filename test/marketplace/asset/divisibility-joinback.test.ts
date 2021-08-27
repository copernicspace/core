import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import { divisibilityFixtureWithWeight } from './divisibility.fixture'
import { getAssetID } from '../../helpers/new-asset-id.helper'

describe('[divisibility-joinback.test.ts]', () => {
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

    before('divide asset', async() => {
        // IDs: 2, 3, 4, 5, 6
		const txr = await assetContract
			.connect(rootUser)
			.divideInto(rootID, 5, 100)
			.then(tx => tx.wait())
        const divide = txr.events.filter(events => events.event === 'Divide').pop()
        mintedIDs = divide.args.listOfIDs
    })

    let joinedBackToken: BigNumber
	it('correctly joins tokens back', async () => {
		const txJoin = await assetContract.connect(rootUser).joinBack(mintedIDs[2]).then(tx => tx.wait())
		joinedBackToken = txJoin.events.filter(events => events.event === 'joinBackEvent').pop().args._idOfUpdatedAsset
		expect(await assetContract.getWeight(joinedBackToken)).to.be.eq(5000 - 5*100 + 100)
		expect(await assetContract.getWeight(mintedIDs[2])).to.be.eq('0')

		for (let i = 0; i < 2; i++) {
			expect(await assetContract.getWeight(mintedIDs[i])).to.be.eq('100')
		}
	})

	it('only allows owner to join back tokens', async () => {
		await expect(assetContract.connect(nonRootUser).joinBack(mintedIDs[2])).to.be.revertedWith('Not owner')
	})

	it('does not allow shell tokens to be joined back', async () => {
		await expect(assetContract.connect(rootUser).joinBack(mintedIDs[2]))
			.to.be.revertedWith('Cannot proceed: token disabled')
	})

	// testing if asset enabled/disabled rule applies
	// to batchDivided tokens
	let createTx, batchDivTx, joinBackTx, joinBackID, newMintIDs
	it('does not allow shell tokens to be joined back after Batch Divide', async () => {
		createTx = await assetContract.connect(nonRootUser).createRoot(true, true, '5000').then(tx => tx.wait())
		expect(await getAssetID(createTx)).to.be.eq('7')

		batchDivTx = await assetContract.connect(nonRootUser).batchDivideInto(7, ['2', '5'], ['1000', '500'])
			.then(tx => tx.wait())
		newMintIDs = await batchDivTx.events.filter(events => events.event === 'Divide').pop()
		console.log(newMintIDs.args.listOfIDs)

		// joining token back:
		joinBackTx = await assetContract.connect(nonRootUser).joinBack(13)
			.then(tx => tx.wait())

		// checking if joined back successfully
		joinBackID = joinBackTx.events.filter(events => events.event === 'joinBackEvent').pop().args._idOfUpdatedAsset
		expect(await assetContract.getWeight(joinBackID)).to.be.eq(5000 - (2 * 1000 + 4 * 500))
		expect(await assetContract.getWeight('13')).to.be.eq('0')

		// checking if shell token restriction applies
		await expect(assetContract.connect(nonRootUser).joinBack('13')).to.be.revertedWith('Cannot proceed: token disabled')
	})

	it('does not allow tokens that are not a division to be joined back', async () => {
		// use child asset's ID: 2
		await expect(assetContract.connect(rootUser).joinBack('1'))
			.to.be.revertedWith('Asset is not a division of another')
	})

})