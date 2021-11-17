import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { parseUnits } from '@ethersproject/units'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/pausable.test] SpaceCargo asset: pausable test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress

	before(
		'load fixtures/parentable`',
		async () => ({ cargoContract, creator, receiver } = await waffle.loadFixture(parentable))
	)

	it('only can be paused by creator', async () => {
		await expect(cargoContract.connect(receiver).pause()).to.be.revertedWith('unauthorized -- only for creator')
	})

	it('cannot send token if paused', async () => {
		await cargoContract.connect(creator).pause()
		await expect(
			cargoContract.connect(creator).send(receiver.address, 0, parseUnits('100', 18))
		).to.be.revertedWith('Pausable: token is paused')
	})
})
