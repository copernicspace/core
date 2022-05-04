import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { KycRegister, PayloadAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { getAssetID } from '../../helpers/getAssetId.helper'

describe('[test/asset/payload/extended-parentable.test] `PayloadAsset`: extended parentable fixture test suite', () => {
	let payloadAsset: PayloadAsset
	let creator: SignerWithAddress
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	const rootID = 0

	before(
		'load fixtures/parentable`',
		async () => ({ payloadAsset, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	let receiver: SignerWithAddress, anotherReceiver: SignerWithAddress
	before('load receivers', async () => ([, , receiver, anotherReceiver] = await ethers.getSigners()))

	describe('create `cosmos` child and assert balances', () => {
		let creatorBalance: BigNumber

		before(
			'save creator balance of root asset',
			async () => (creatorBalance = await payloadAsset.balanceOf(creator.address, rootID))
		)

		before(
			'kyc approve account A',
			async () => await kycContract.connect(deployer).setKycStatus(receiver.address, true)
		)
		const cosmosChildAmount = parseUnits('105', 18)
		let cosmosChildId: BigNumber
		before('creates 105 cosmos child from creator to account A', async () => {
			cosmosChildId = await payloadAsset
				.connect(creator)
				.createChild(cosmosChildAmount, rootID, 'CosmosChild', receiver.address)
				.then(tx => tx.wait())
				.then(txr => getAssetID(txr))
		})
		it('has correct creators balance of root asset after `cosmos` child create', async () =>
			expect(await payloadAsset.balanceOf(creator.address, rootID)).to.be.eq(
				creatorBalance.sub(cosmosChildAmount)
			))

		it('has correct balance of cosmos child', async () =>
			expect(await payloadAsset.balanceOf(receiver.address, cosmosChildId)).to.be.eq(cosmosChildAmount))
	})

	describe('create `star` child and assert balance', () => {
		let creatorBalance: BigNumber
		before(
			'save creator balance of root asset',
			async () => (creatorBalance = await payloadAsset.balanceOf(creator.address, rootID))
		)

		before(
			'kyc approve account B',
			async () => await kycContract.connect(deployer).setKycStatus(anotherReceiver.address, true)
		)
		const starChildAmount = parseUnits('555', 18)
		let starChildId: BigNumber
		before(
			'creates 555 star child from creator account B',
			async () =>
				(starChildId = await payloadAsset
					.connect(creator)
					.createChild(starChildAmount, rootID, 'StarChild', anotherReceiver.address)
					.then(tx => tx.wait())
					.then(txr => getAssetID(txr)))
		)

		it('has correct creators balance of root asset after `star` child create', async () =>
			expect(await payloadAsset.balanceOf(creator.address, rootID)).to.be.eq(creatorBalance.sub(starChildAmount)))

		it('has correct balance of start child', async () =>
			expect(await payloadAsset.balanceOf(anotherReceiver.address, starChildId)).to.be.eq(starChildAmount))
	})
})
