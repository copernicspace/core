import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/parentable.test] SpaceCargo asset: parentable fixture test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress
	let totalSupply: BigNumber
	let childID: BigNumber
	let amount: BigNumber

	before(
		'load fixtures/parentable`',
		async () =>
			({ cargoContract, creator, totalSupply, receiver, childID, amount } = await waffle.loadFixture(parentable))
	)

	it('correct creator balance after create child and send to receiver', async () => {
		const actual = await cargoContract.balanceOf(creator.address, '0')
		const expected = totalSupply.sub(amount)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct childID', async () => {
		const actual = childID
		const expected = BigNumber.from(1)
		expect(expected).to.be.eq(actual)
	})

	it('correct receiver balance of new child asset', async () => {
		const actual = await cargoContract.balanceOf(receiver.address, childID)
		const expected = amount
		expect(expected).to.be.eq(actual)
	})

	it('correct creator balance of new asset', async () => {
		const actual = await cargoContract.balanceOf(creator.address, childID)
		expect(0).to.be.eq(actual)
	})

	it('check name', async () =>
		expect(await cargoContract.getFullName(childID)).to.be.eq('rootSpaceCargoName/childSpaceCargoName'))

	it('check getName()', async () => {
		const actual = await cargoContract.getName(childID)
		expect('childSpaceCargoName').to.be.eq(actual)
	})

	it('check getParent()', async () => {
		const actual = await cargoContract.getParent(childID)
		expect(0).to.be.eq(actual)
	})

	it('disallows non-creators from creating child asset', async () => {
		await expect(
			cargoContract.connect(receiver).createChild(50, childID, 'revert.test.com', receiver.address)
		).to.be.revertedWith('unauthorized -- only for creator')
	})

	it('reverts if insufficient balance', async () => {
		await expect(
			cargoContract.connect(creator).createChild(50, childID, 'revert-insufficient.test.com', creator.address)
		).to.be.revertedWith('ERC1155: burn amount exceeds balance')
	})

	it('inherits correct uri', async () => {
		// should have the same URI as original asset
		const actual = await cargoContract.uri(childID)
		const expected = 'test.uri.com'
		expect(expected).to.be.eq(actual)
	})
})
