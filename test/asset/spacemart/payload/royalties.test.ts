import { waffle } from 'hardhat'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { KycRegister, PayloadAsset, PayloadFactory } from '../../../../typechain'
import { createPayloadAssetWithRoyalties } from './fixtures/create.fixture'

describe('[test/asset/payload/royalties.test] SpacePayload asset with royalties: create fixture test suite', () => {
	let userA: SignerWithAddress, userB: SignerWithAddress

	before('load userA as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))
	let creator: SignerWithAddress
	let payloadFactory: PayloadFactory
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister

	beforeEach(
		'load fixtures/deploy`',
		async () =>
			({ payloadFactory, payloadAsset, creator, kycContract } = await waffle.loadFixture(
				createPayloadAssetWithRoyalties
			))
	)

	it('has correct uri', async () => {
		const actual = await payloadAsset.uri('1')
		const expected = 'test.uri.com'
		expect(expected).to.be.eq(actual)
	})

	it('has correct name', async () => {
		const actual = await payloadAsset.getName(0)
		const expected = 'rootSpacePayloadName'
		expect(expected).to.be.eq(actual)
	})

	it('has correct decimals', async () => {
		const actual = await payloadAsset.decimals()
		const expected = BigNumber.from(18)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct supply', async () => {
		const actual = await payloadAsset.balanceOf(creator.address, 0)
		const expected = parseUnits('3500', 18)
		expect(expected).to.be.eq(actual)
	})

	it('has correct royalties percent', async () => {
		const actual = await payloadAsset.royalties()
		const decimals = await payloadAsset.decimals()
		const expected = parseUnits('5', decimals)
		expect(expected).to.be.eq(actual)
	})

	it('disallows non-factory-clients from creating payload', async () => {
		await expect(
			payloadFactory
				.connect(userA)
				.create('test.revert.com', 'revert test asset', 18, 6000, kycContract.address, 5, false)
		).to.be.revertedWith('You are not allowed to create new SpaceAsset:Payload')
	})

	it('disallows non-managers from adding clients', async () => {
		await expect(payloadFactory.connect(userA).addClient(userB.address)).to.be.revertedWith(
			'Only factory owner & managers can add clients'
		)
	})

	it('disallows non-factory-owners adding new factory managers', async () => {
		await expect(payloadFactory.connect(userB).addManager(userA.address)).to.be.revertedWith(
			'Only factory owner can add managers'
		)
	})
})
