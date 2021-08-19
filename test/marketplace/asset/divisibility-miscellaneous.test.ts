import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, ContractReceipt } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import { divisibilityFixtureWithWeight } from './divisibility.fixture'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

describe('[divisibility-miscellaneous.test.ts]', () => {
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

	let indivisibleTokenTx: ContractReceipt
	before(
		'create indivisible root asset and get ID of new token',
		async () =>
			(indivisibleTokenTx = await assetContract
				.connect(rootUser)
				.createRoot(true, false, 3500)
				.then(tx => tx.wait()))
	)

	it('created new asset successfully', async () =>
		expect(indivisibleTokenTx.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let indivisibleTokenID: BigNumber
	before(
		'extract new Lunar Outpost asset ID from tx receipt event',
		async () => (indivisibleTokenID = getAssetID(indivisibleTokenTx))
	)

	it('set correct new asset ID', async () => expect(indivisibleTokenID).to.be.equal('2'))

	it('set correct weight', async () => expect(await assetContract.getWeight(indivisibleTokenID)).to.be.eq('3500'))

	it('disallows assets with division set to false to be divided', async () =>
		await expect(assetContract.connect(rootUser).divideInto(indivisibleTokenID, 100, 5)).to.be.revertedWith(
			'Asset has divisibility disabled'
		))

	// setting minimal step size
	it('correctly sets minimal step size', async () => {
		await assetContract.connect(rootUser).setMinStepSize(rootID, 100)
		expect(await assetContract.getMinStepSize(rootID)).to.be.eq('100')
	})

	it('disallows non-owners from setting minimal step size', async () => {
		await expect(assetContract.connect(nonRootUser).setMinStepSize(rootID, 100)).to.be.revertedWith('Not owner')
	})

	it('restricts division to be a multiple of step size', async () => {
		// await assetContract.connect(rootUser).makeDivisible(rootID)
		await expect(assetContract.connect(rootUser).divideInto(rootID, 3, 350)).to.be.revertedWith(
			'Required step size is not a viable multiple of minimal step size'
		)
	})

	it('ensures that asset cannot be divided into tokens of weight or num 0', async () => {
		await expect(
			assetContract.connect(rootUser).batchDivideInto(rootID, ['0', '5'], ['100', '200'])
		).to.be.revertedWith('Step number must be positive (non-zero)')
		await expect(assetContract.connect(rootUser).batchDivideInto(rootID, ['5', '10'], ['0', '200'])).to.be.revertedWith(
			'Step size must be positive (non-zero)'
		)
	})
})
