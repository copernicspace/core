import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { getAssetID } from '../../helpers/getAssetId.helper'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/extended-parentable.test] SpaceCargo asset: extended parentable fixture test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	const rootID = 0

	before('load fixtures/parentable`', async () => ({ cargoContract, creator } = await waffle.loadFixture(parentable)))

	let accountA: SignerWithAddress, accountB: SignerWithAddress
	before('load receivers', async () => ([accountA, accountB] = await ethers.getSigners()))

	const cosmosChildAmount = parseUnits('105', 18)
	let cosmosChildId: BigNumber
	it('creates 105 cosmos child from creator account A', async () => {
		const creatorBalanceBefore = await cargoContract.balanceOf(creator.address, rootID)

		cosmosChildId = await cargoContract
			.connect(creator)
			.createChild(cosmosChildAmount, rootID, 'CosmosChild', accountA.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(await cargoContract.balanceOf(accountA.address, cosmosChildId)).to.be.eq(cosmosChildAmount)
		const creatorBalanceAfter = await cargoContract.balanceOf(creator.address, rootID)
		expect(creatorBalanceBefore.sub(creatorBalanceAfter)).to.be.eq(cosmosChildAmount)
	})

	it('has correct balance of cosmos child', async () =>
		expect(await cargoContract.balanceOf(accountA.address, cosmosChildId)).to.be.eq(cosmosChildAmount))

	const starChildAmount = parseUnits('555', 18)
	let starChildId: BigNumber
	it('creates 555 star child from creator account A', async () => {
		const creatorBalanceBefore = await cargoContract.balanceOf(creator.address, rootID)

		starChildId = await cargoContract
			.connect(creator)
			.createChild(starChildAmount, rootID, 'StarChild', accountB.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		const creatorBalanceAfter = await cargoContract.balanceOf(creator.address, rootID)
		expect(creatorBalanceBefore.sub(creatorBalanceAfter)).to.be.eq(starChildAmount)
	})

	it('has correct balance of start child', async () =>
		expect(await cargoContract.balanceOf(accountB.address, starChildId)).to.be.eq(starChildAmount))
})
