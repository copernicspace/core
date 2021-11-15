import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'
import { getAssetID } from '../../helpers/getAssetId.helper'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/parentable.test] SpaceCargo asset: parentable fixture test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress
	let totalSupply: BigNumber
	let receiverAmount: BigNumber
	let rootID: BigNumber
	let childID: BigNumber
	let deployer: SignerWithAddress
	let createdAmount: BigNumber
	let grandChildID: BigNumber

	beforeEach(
		'load fixtures/parentable`',
		async () =>
			({ cargoContract, creator, receiver, receiverAmount, totalSupply, childID, grandChildID, createdAmount } =
				await waffle.loadFixture(parentable))
	)

	it('correct creator balance after create child and send to receiver', async () => {
		const actual = await cargoContract.balanceOf(creator.address, '1')
		const expected = totalSupply.sub(createdAmount)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct childID', async () => {
		const actual = childID
		const expected = BigNumber.from(2)
		expect(expected).to.be.eq(actual)
	})

	it('correct receiver balance of new child asset', async () => {
		const actual = await cargoContract.balanceOf(receiver.address, childID)
		const expected = receiverAmount
		expect(expected).to.be.eq(actual)
	})

	it('correct creator balance of new asset', async () => {
		const actual = await cargoContract.balanceOf(creator.address, childID)
		const expected = createdAmount.sub(receiverAmount).sub(receiverAmount)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct grand-child asset ID', async () => {
		const actual = grandChildID
		const expected = BigNumber.from(3)
		expect(expected).to.be.eq(actual)
	})

	it('correct receiver balance of new grand-child asset', async () => {
		const actual = await cargoContract.balanceOf(receiver.address, grandChildID)
		const expected = receiverAmount
		expect(expected).to.be.eq(actual)
	})

	it('correct creator balance of new asset', async () => {
		const actual = await cargoContract.balanceOf(creator.address, grandChildID)
		const expected = receiverAmount.sub(receiverAmount)
		expect(expected).to.be.eq(actual)
	})

})
