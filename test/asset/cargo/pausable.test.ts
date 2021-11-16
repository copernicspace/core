import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/pausable.test] SpaceCargo asset: pausable test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress
	let creatorAmount: BigNumber
	let receiverAmount: BigNumber
	let rootID: BigNumber
	let childID: BigNumber

	before(
		'load fixtures/parentable`',
		async () =>
			({ cargoContract, creator, receiver, receiverAmount, childID } = await waffle.loadFixture(parentable))
	)

	it('only can be paused by creator', async () => {
		rootID = await cargoContract.childPID()

		await expect(cargoContract.connect(receiver).pause(rootID)).to.be.revertedWith(
			'Pausable: only asset creator can pause'
		)
	})

	it('cannot send root if locked', async () => {
		await cargoContract.connect(creator).pause(rootID)
		await expect(
			cargoContract.connect(creator).send(receiver.address, rootID, parseUnits('100', 18))
		).to.be.revertedWith('Pausable: token transfer while paused')
	})
})
