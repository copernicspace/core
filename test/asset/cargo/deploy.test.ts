// @filename cargo-deploy.test.ts
import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoFactory } from '../../../typechain'
import { deploy } from './fixtures/deploy.fixture'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

export const cargoDeployTest =
	describe('[test/asset/cargo/deploy.test] SpaceCargo asset: deploy fixture test suite', () => {
		let userA, userB: SignerWithAddress
		before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

		let cargoFactory: CargoFactory
		before('load fixtures/deploy`', async () => ({ cargoFactory } = await waffle.loadFixture(deploy)))

		it('has success tx receipt status', async () =>
			await cargoFactory.deployTransaction
				.wait()
				.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

		it('reverts as userA is not allowed on CargoFactory', async () =>
			await expect(
				cargoFactory.connect(userA).createCargo('test.uri.com', 'TestSpaceCargoName', 18, '3500')
			).to.be.revertedWith('You are not allowed to create new SpaceCargo'))

		it('reverts if add address to factory `allowed` from non-operator', async () => {
			await expect(cargoFactory.connect(userA).addClient(userA.address)).to.be.revertedWith(
				'Only factory owner can add managers'
			)
		})
	})
