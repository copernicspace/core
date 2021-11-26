import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory } from '../../../typechain'
import { create } from './fixtures/create.fixture'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'

describe('[test/asset/cargo/create.test] SpaceCargo asset: create fixture test suite', () => {
	let userA, userB, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContractAddress: string
	beforeEach(
		'load fixtures/deploy`',
		async () => ({ cargoFactory, cargoContract, creator, kycContractAddress } = await waffle.loadFixture(create))
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

	it('disallows non-factory-clients from creating cargo', async () => {
		await expect(
			cargoFactory
				.connect(userA)
				.createCargo('test.revert.com', 'revert test asset', 18, 6000, kycContractAddress)
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
