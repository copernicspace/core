import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset, KycRegister } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { loadFixture } from '@ethereum-waffle/provider'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/extended-parentable.test] SpaceCargo asset: extended parentable fixture test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	const rootID = 0

	before(
		'load fixtures/parentable`',
		async () => ({ cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	let accountA: SignerWithAddress, accountB: SignerWithAddress
	before('load receivers', async () => ([, , accountA, accountB] = await ethers.getSigners()))

	describe('create `cosmos` child and assert balances', () => {
		let creatorBalance: BigNumber
		before(
			'save creator balance of root asset',
			async () => (creatorBalance = await cargoContract.balanceOf(creator.address, rootID))
		)

		before(
			'kyc approve account A',
			async () => await kycContract.connect(deployer).setKycStatus(accountA.address, true)
		)
		const cosmosChildAmount = parseUnits('105', 18)
		let cosmosChildId: BigNumber
		before(
			'creates 105 cosmos child from creator to account A',
			async () =>
				(cosmosChildId = await cargoContract
					.connect(creator)
					.createChild(cosmosChildAmount, rootID, 'CosmosChild', accountA.address)
					.then(tx => tx.wait())
					.then(txr => getAssetID(txr)))
		)
		it('has correct creators balance of root asset after `cosmos` child create', async () =>
			expect(await cargoContract.balanceOf(creator.address, rootID)).to.be.eq(
				creatorBalance.sub(cosmosChildAmount)
			))

		it('has correct balance of cosmos child', async () =>
			expect(await cargoContract.balanceOf(accountA.address, cosmosChildId)).to.be.eq(cosmosChildAmount))
	})

	describe('create `star` child and assert balance', () => {
		let creatorBalance: BigNumber
		before(
			'save creator balance of root asset',
			async () => (creatorBalance = await cargoContract.balanceOf(creator.address, rootID))
		)

		before(
			'kyc approve account B',
			async () => await kycContract.connect(deployer).setKycStatus(accountB.address, true)
		)
		const starChildAmount = parseUnits('555', 18)
		let starChildId: BigNumber
		before(
			'creates 555 star child from creator account B',
			async () =>
				(starChildId = await cargoContract
					.connect(creator)
					.createChild(starChildAmount, rootID, 'StarChild', accountB.address)
					.then(tx => tx.wait())
					.then(txr => getAssetID(txr)))
		)

		it('has correct creators balance of root asset after `star` child create', async () =>
			expect(await cargoContract.balanceOf(creator.address, rootID)).to.be.eq(
				creatorBalance.sub(starChildAmount)
			))

		it('has correct balance of start child', async () =>
			expect(await cargoContract.balanceOf(accountB.address, starChildId)).to.be.eq(starChildAmount))
	})
})
