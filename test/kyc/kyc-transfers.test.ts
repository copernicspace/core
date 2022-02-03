import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { kyc } from '../asset/cargo/fixtures/kyc.fixture'
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
	let cargoContract: CargoAsset
	let decimals: number

	before(
		'load fixtures/kyc`',
		async () => ({ cargoContract, decimals, kycUserA, kycUserB, assetID } = await waffle.loadFixture(kyc))
	)

	before('load non kyc addresses', async () => ([, , , , , nonKycUserC] = await ethers.getSigners()))

	it('ok status and balances on transfer to kyc address', async () => {
		const balanceBefore = BigNumber.from('1420')
		const transferAmount = BigNumber.from('42')

		expect(await cargoContract.balanceOf(kycUserA.address, assetID)).to.be.eq(balanceBefore)

		const txr = await cargoContract
			.connect(kycUserA)
			.transfer(kycUserB.address, assetID, transferAmount)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(await cargoContract.balanceOf(kycUserA.address, assetID)).to.be.eq(balanceBefore.sub(transferAmount))
		expect(await cargoContract.balanceOf(kycUserB.address, assetID)).to.be.eq(transferAmount)
	})

	it('reverts on transfer to non-KYC address', async () =>
		await expect(
			cargoContract.connect(kycUserA).transfer(nonKycUserC.address, 0, parseUnits('100', decimals))
		).to.be.revertedWith('receiver/buyer is not on KYC list'))

	it('reverts on transfer from non-KYC address', async () =>
		await expect(
			cargoContract.connect(nonKycUserC).transfer(kycUserA.address, 0, parseUnits('100', decimals))
		).to.be.revertedWith('sender/seller is not on KYC list'))
})
