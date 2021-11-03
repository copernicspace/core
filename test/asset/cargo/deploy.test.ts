// @filename cargo-deploy.test.ts
import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset } from '../../../typechain'
import { deploy } from './fixtures/deploy.fixture'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

export const cargoDeployTest =
	describe('[test/asset/cargo/deploy.test] SpaceCargo asset: deploy fixture test suite', () => {
		let cargoContract: CargoAsset
		before(
			'load fixtures/deploy`',
			async () => ({ cargoContract } = await waffle.loadFixture(deploy))
		)

		it('was deployed with OK receipt status', async () =>
			await cargoContract.deployTransaction
				.wait()
				.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))
	})
