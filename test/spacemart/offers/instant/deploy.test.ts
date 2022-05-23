import { waffle } from 'hardhat'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../../constants/tx-receipt-status'
import { InstantOffer } from '../../../../typechain'
import { deployInstantOffer } from './fixtures/deployOffer.fixture'

describe('[offers/instant/deploy.test]', () => {
	let instantOffer: InstantOffer
	before('load `fixtures/deployInstantOffer`', async () => ({ instantOffer } = await waffle.loadFixture(deployInstantOffer)))

	it('should have success tx receipt status', async () =>
		await instantOffer.deployTransaction
			.wait()
			.then(deployTxr => expect(deployTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))
})
