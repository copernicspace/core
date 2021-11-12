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

		it('sets correct supply', async () => {
            // Why is balance of ID=0 equal to 3500?
            // should it be ID=1 ?
			const actual = await cargoContract.balanceOf(cargoFactory.address, '1')
			const expected = BigNumber.from(3500)
			expect(expected).to.be.eq(actual)
		})
	})
