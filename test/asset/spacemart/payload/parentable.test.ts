import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parentable } from './fixtures/parentable.fixture'
import { PayloadAsset } from '../../../../typechain'
import { getAssetID } from '../../../helpers/getAssetId.helper'

describe('[test/asset/payload/parentable.test] `PayloadAsset`: parentable fixture test suite', () => {
	let payloadAsset: PayloadAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress
	let totalSupply: BigNumber
	let childID: BigNumber
	let amount: BigNumber

	before(
		'load fixtures/parentable`',
		async () =>
			({ payloadAsset, creator, totalSupply, receiver, childID, amount } = await waffle.loadFixture(parentable))
	)

	it('correct creator balance after create child and send to receiver', async () => {
		const actual = await payloadAsset.balanceOf(creator.address, '0')
		const expected = totalSupply.sub(amount)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct childID', async () => {
		const actual = childID
		const expected = BigNumber.from(1)
		expect(expected).to.be.eq(actual)
	})

	it('correct receiver balance of new child asset', async () => {
		const actual = await payloadAsset.balanceOf(receiver.address, childID)
		const expected = amount
		expect(expected).to.be.eq(actual)
	})

	it('correct creator balance of new asset', async () => {
		const actual = await payloadAsset.balanceOf(creator.address, childID)
		expect(0).to.be.eq(actual)
	})

	it('check name', async () =>
		expect(await payloadAsset.getFullName(childID)).to.be.eq('rootSpacePayloadName/childSpacePayloadName'))

	it('check getName()', async () => {
		const actual = await payloadAsset.getName(childID)
		expect('childSpacePayloadName').to.be.eq(actual)
	})

	it('check getParent()', async () => {
		const actual = await payloadAsset.getParent(childID)
		expect(0).to.be.eq(actual)
	})

	it('disallows non-creators from creating child asset', async () => {
		await expect(
			payloadAsset.connect(receiver).createChild(50, childID, 'revert.test.com', receiver.address)
		).to.be.revertedWith('Creator: caller is not the creator')
	})

	it('reverts if insufficient balance', async () => {
		await expect(
			payloadAsset.connect(creator).createChild(50, childID, 'revert-insufficient.test.com', creator.address)
		).to.be.revertedWith('ERC1155: burn amount exceeds balance')
	})

	it('inherits correct uri', async () => {
		// should have the same URI as original asset
		const actual = await payloadAsset.uri(childID)
		const expected = 'test.uri.com'
		expect(expected).to.be.eq(actual)
	})

	it('create grandChild', async () => {
		const tx = await payloadAsset.connect(creator).createChild(100, '0', ' test', creator.address)
		const newChildId = await tx.wait().then(txr => getAssetID(txr))
		expect(newChildId).to.be.eq(2)

		const gtx = await payloadAsset.connect(creator).createChild(100, newChildId, 'nameGrandChild', creator.address)
		const grandChildId  = await gtx.wait().then(txr => getAssetID(txr))
		const actual = await payloadAsset.getParent(grandChildId)
		expect(actual).to.be.eq(2)
	})
})
