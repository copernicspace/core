import { waffle } from 'hardhat'
import { expect } from 'chai'
import { PayloadAsset } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { kyc } from '../asset/payload/fixtures/kyc.fixture'
import { BigNumber } from '@ethersproject/bignumber'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'

/**
 * Test suite for checking KycRegister permission change process
 */
describe('[test/kyc/kyc-transfers.test]: KYC revert on transfer testing', () => {
	let kycUserA: SignerWithAddress
	let kycUserB: SignerWithAddress
	let nonKycUserC: SignerWithAddress
	let assetID: BigNumber
	let payloadAsset: PayloadAsset
	let decimals: number

	before(
		'load fixtures/kyc`',
		async () => ({ payloadAsset, decimals, kycUserA, kycUserB, assetID } = await waffle.loadFixture(kyc))
	)

	before('load non kyc addresses', async () => ([, , , , , nonKycUserC] = await ethers.getSigners()))

	it('ok status and balances on transfer to kyc address', async () => {
		const balanceBefore = BigNumber.from('1420')
		const transferAmount = BigNumber.from('42')

		expect(await payloadAsset.balanceOf(kycUserA.address, assetID)).to.be.eq(balanceBefore)

		const txr = await payloadAsset
			.connect(kycUserA)
			.safeTransferFrom(kycUserA.address, kycUserB.address, assetID, transferAmount, '0x')
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(await payloadAsset.balanceOf(kycUserA.address, assetID)).to.be.eq(balanceBefore.sub(transferAmount))
		expect(await payloadAsset.balanceOf(kycUserB.address, assetID)).to.be.eq(transferAmount)
	})

	const amount = parseUnits('100', decimals)
	it('reverts on transfer to non-KYC address', async () =>
		await expect(
			payloadAsset.connect(kycUserA).safeTransferFrom(kycUserA.address, nonKycUserC.address, 0, amount, '0x')
		).to.be.revertedWith('receiver/buyer is not on KYC list'))

	it('reverts on transfer from non-KYC address', async () =>
		await expect(
			payloadAsset.connect(nonKycUserC).safeTransferFrom(nonKycUserC.address, kycUserA.address, 0, amount, '0x')
		).to.be.revertedWith('sender/seller is not on KYC list'))
})
