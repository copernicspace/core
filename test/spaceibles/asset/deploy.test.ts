import { waffle } from 'hardhat'
import { expect } from 'chai'

import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { deploySpaceibleAsset } from './fixtures/deploy.fixture'

describe('[spaceibles/asset/deploy]', () =>
	it('should have `success` status on `SpaceibleAsset` deploy tx receipt', async () =>
		await waffle
			.loadFixture(deploySpaceibleAsset)
			.then(fixture => fixture.spaceibleAsset.deployTransaction.wait())
			.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))))
