import { waffle } from 'hardhat'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { CargoAsset, CargoFactory, KycRegister } from '../../../typechain'
import { createCargoAssetWithRoyalties } from './fixtures/create.fixture'

describe('[test/asset/cargo/royalties.test] SpaceCargo asset with royalties: create fixture test suite', () => {
	let userA, userB, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	beforeEach(
		'load fixtures/deploy`',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract } = await waffle.loadFixture(
				createCargoAssetWithRoyalties
			))
	)

	it('has correct uri', async () => {
		const actual = await cargoContract.uri('1')
		const expected = 'test.uri.com'
		expect(expected).to.be.eq(actual)
	})

	it('has correct name', async () => {
		const actual = await cargoContract.getName(0)
		const expected = 'rootSpaceCargoName'
		expect(expected).to.be.eq(actual)
	})

	it('has correct decimals', async () => {
		const actual = await cargoContract.decimals()
		const expected = BigNumber.from(18)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct supply', async () => {
		const actual = await cargoContract.balanceOf(creator.address, 0)
		const expected = parseUnits('3500', 18)
		expect(expected).to.be.eq(actual)
	})

	it('has correct royalties percent', async () => {
		const actual = await cargoContract.royalties()
		const decimals = await cargoContract.decimals()
		const expected = parseUnits('5', decimals)
		expect(expected).to.be.eq(actual)
	})

	it('disallows non-factory-clients from creating cargo', async () => {
		await expect(
			cargoFactory
				.connect(userA)
				.createCargo('test.revert.com', 'revert test asset', 18, 6000, kycContract.address, 5, false)
		).to.be.revertedWith('You are not allowed to create new SpaceCargo')
	})

	it('disallows non-managers from adding clients', async () => {
		await expect(cargoFactory.connect(userA).addClient(userB.address)).to.be.revertedWith(
			'Only factory owner & managers can add clients'
		)
	})

	it('disallows non-factory-owners adding new factory managers', async () => {
		await expect(cargoFactory.connect(userB).addManager(userA.address)).to.be.revertedWith(
			'Only factory owner can add managers'
		)
	})
})
