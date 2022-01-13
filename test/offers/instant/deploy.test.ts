import { expect } from 'chai'
import { waffle } from 'hardhat'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { InstantOffer } from '../../../typechain'
import { deployInstantOffer } from './fixtures/deployInstantOffer.fixture'

describe('instant offer: deploy test suite', () => {
	let instantOffer: InstantOffer
	before(
		'load `fixtures/deployInstantOffer`',
		async () => ({ instantOffer } = await waffle.loadFixture(deployInstantOffer))
	)

	it('should have success tx receipt status', async () =>
		await instantOffer.deployTransaction
			.wait()
			.then(deployTxr => expect(deployTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))
})
