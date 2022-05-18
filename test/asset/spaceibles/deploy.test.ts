import { waffle } from 'hardhat'
import { expect } from 'chai'

import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { deploySpaceibleAsset } from './fixtures/deploy.fixture'

describe('[test/asset/spaceible/deploy.test', () =>
	it('should have `success` status on `SpaceibleAsset` deploy tx receipt', async () => {
		const actual = await waffle
			.loadFixture(deploySpaceibleAsset)
			.then(fixture => fixture.spaceibleAsset.deployTransaction.wait())
			.then(txr => txr.status)

		expect(actual).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
	}))
