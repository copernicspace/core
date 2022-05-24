import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from '@ethersproject/units'
import { ethers, waffle } from 'hardhat'
import { BigNumber } from 'ethers'
import { expect } from 'chai'

import { createPayloadAssetPaused } from './fixtures/create.fixture'
import { KycRegister, PayloadAsset } from '../../../../typechain'

describe('[spacemart/assets/payload/payload/create-pausable.test] `PayloadAsset`: pausable test suite', () => {
	let payloadAsset: PayloadAsset
	let deployer, creator, receiver: SignerWithAddress
	let kycContract: KycRegister

	before('load receiver', async () => ([, , receiver] = await ethers.getSigners()))

	before(
		'load fixtures/create::createPayloadAssetPaused`',
		async () =>
			({ payloadAsset, deployer, creator, kycContract } = await waffle.loadFixture(createPayloadAssetPaused))
	)

	it('asset is paused after creation', async () => expect(await payloadAsset.paused()).to.be.eq(true))

	describe('transfers when asset `paused()`', async () => {
		const amount = parseUnits('100', 18)

		before('load receiver and transfer funds to him from creator', async () => {
			await kycContract.connect(deployer).setKycStatus(receiver.address, true)
			await payloadAsset.connect(creator).safeTransferFrom(creator.address, receiver.address, 0, amount, '0x')
		})

		it('creator can successfully send tokens if paused', async () => {
			expect(await payloadAsset.paused()).to.be.eq(true)

			const balanceStart = await payloadAsset.balanceOf(receiver.address, 0)
			await payloadAsset.connect(creator).safeTransferFrom(creator.address, receiver.address, 0, amount, '0x')
			const balanceEnd = await payloadAsset.balanceOf(receiver.address, 0)

			expect(balanceStart.add(BigNumber.from(amount))).to.be.eq(balanceEnd)
		})

		it('non-creator cannot send tokens if paused', async () => {
			await expect(
				payloadAsset.connect(receiver).safeTransferFrom(receiver.address, creator.address, 0, amount, '0x')
			).to.be.revertedWith('Pausable: asset is locked')
		})
	})
})
