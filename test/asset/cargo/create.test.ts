// @filename create.test.ts
import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory } from '../../../typechain'
import { create } from './fixtures/create.fixture'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'

describe('[test/asset/cargo/create.test] SpaceCargo asset: create fixture test suite', () => {
	let userA, userB, creator, deployer: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	before(
		'load fixtures/deploy`',
		async () => ({ deployer, cargoFactory, cargoContract, creator } = await waffle.loadFixture(create))
	)

	it('has correct uri', async () => {
		const actual = await cargoContract.uri('1')
		const expected = 'test.uri.com'
		expect(expected).to.be.eq(actual)
	})

	it('has correct name', async () => {
		const actual = await cargoContract.name()
		const expected = 'testSpaceCargo'
		expect(expected).to.be.eq(actual)
	})

	it('has correct decimals', async () => {
		const actual = await cargoContract.decimals()
		const expected = BigNumber.from(18)
		expect(expected).to.be.eq(actual)
	})

	it('sets correct supply', async () => {
		const actual = await cargoContract.balanceOf(creator.address, '1')
		const expected = parseUnits('3500', 18)
		expect(expected).to.be.eq(actual)
	})
})
