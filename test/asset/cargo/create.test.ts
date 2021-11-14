// @filename create.test.ts
import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory } from '../../../typechain'
import { create } from './fixtures/create.fixture'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'

export const cargoDeployTest =
	describe('[test/asset/cargo/create.test] SpaceCargo asset: create fixture test suite', () => {
		let userA, userB, creator, deployer: SignerWithAddress
		before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

		let cargoFactory: CargoFactory
		let cargoContract: CargoAsset
		before(
			'load fixtures/deploy`',
			async () => ({ deployer, cargoFactory, cargoContract, creator } = await waffle.loadFixture(create))
		)

		it('sets correct uri', async() => {
			const actual = await cargoContract.uri('1')
			const expected = 'test.uri.com'
			expect(expected).to.be.eq(actual)
		})

		it('sets correct name', async() => {
			const actual = await cargoContract.name()
			const expected = 'MyTestName'
			expect(expected).to.be.eq(actual)
		})

		it('sets correct decimals', async() => {
			const actual = await cargoContract.decimals()
			const expected = BigNumber.from(18)
			expect(expected).to.be.eq(actual)
		})

		it('sets correct supply', async () => {
			const actual = await cargoContract.balanceOf(creator.address, '1')
			const expected = BigNumber.from(3500)
			expect(expected).to.be.eq(actual)
		})		
	})
