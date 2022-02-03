import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset, KycRegister } from '../../../typechain'
import { parseUnits } from '@ethersproject/units'
import { ethers } from 'hardhat'
import { createCargoAssetPaused } from './fixtures/pausable.fixture'
import { BigNumber } from 'ethers'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/created-pausable.test] SpaceCargo asset: pausable test suite', () => {
	let cargoContract: CargoAsset
	let creator, receiver, userA, deployer: SignerWithAddress
	let kycContract: KycRegister

	before(
		'load fixtures/pausable`',
		async () => ({ cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(createCargoAssetPaused))
	)
	before('load receiver', async () => ([, , receiver] = await ethers.getSigners()))

	it('asset is paused after creation', async () => expect(await cargoContract.paused()).to.be.eq(true))

	describe('transfers when asset `paused()`', async() => {
		before('load userA and transfer funds', async() => {
			// get a signer who is not a creator
			[, , userA] = await ethers.getSigners()
			// add this signer to kyc list (so that they can send/receive)
			await kycContract.connect(deployer).setKycStatus(userA.address, true)
			// transfer before test
			await cargoContract.connect(creator).transfer(userA.address, 0, '100')
		})

		it('creator can successfully send tokens if paused', async() => {
			const amount = parseUnits('100', 18)

			const balanceStart = await cargoContract.balanceOf(receiver.address, 0)
			await cargoContract.connect(creator).transfer(receiver.address, 0, amount)
			const balanceEnd = await cargoContract.balanceOf(receiver.address, 0)

			expect(balanceStart.add(BigNumber.from(amount))).to.be.eq(balanceEnd)
		})
	
		it('non-creator cannot send tokens if paused', async () => {
			await expect(
				cargoContract.connect(userA).transfer(receiver.address, 0, parseUnits('100', 18))
			).to.be.revertedWith('Pausable: only creator can transfer paused assets')
		})
	})
})
