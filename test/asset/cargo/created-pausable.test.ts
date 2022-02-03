import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parseUnits } from '@ethersproject/units'
import { ethers } from 'hardhat'
import { createCargoAssetPaused } from './fixtures/pausable.fixture'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/created-pausable.test] SpaceCargo asset: pausable test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress

	before(
		'load fixtures/pausable`',
		async () => ({ cargoContract, creator } = await waffle.loadFixture(createCargoAssetPaused))
	)
	before('load receiver', async () => ([, , receiver] = await ethers.getSigners()))

	it('asset is paused after creation', async () => expect(await cargoContract.paused()).to.be.eq(true))

	it('cannot send token if paused', async () => {
		await expect(
			cargoContract.connect(creator).transfer(creator.address, 0, parseUnits('100', 18))
		).to.be.revertedWith('Pausable: token is paused')
	})
})
