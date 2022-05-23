import { waffle } from 'hardhat'
import { expect } from 'chai'

import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'

describe('[spaceibles/offer/deploy]', () =>
	it('should have `success` status on `SpaceibleAsset` deploy tx receipt', async () =>
		await waffle
			.loadFixture(deploySpaceibleOffer)
			.then(fixture => fixture.spaceibleOffer.deployTransaction.wait())
			.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))))
