import { waffle } from 'hardhat'
import { expect } from 'chai'

import { TX_RECEIPT_STATUS } from '../../../utils/constants/tx-receipt-status'
import { deploySpaceibleOffer } from './fixtures/deploy.fixture'
import { SpaceibleOffer } from '../../../typechain'

describe('[spaceibles/offer/deploy]', () => {
	let spaceibleOffer: SpaceibleOffer

	before(
		'load offer/fixtures/deploy',
		async () => ({ spaceibleOffer } = await waffle.loadFixture(deploySpaceibleOffer))
	)

	it('should have `success` status on `SpaceibleAsset` deploy tx receipt', async () =>
		expect(await spaceibleOffer.deployTransaction.wait().then(txr => txr.status)).to.be.eq(
			TX_RECEIPT_STATUS.SUCCESS
		))
})
