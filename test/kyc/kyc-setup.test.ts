import { expect } from 'chai'
import { PayloadAsset, KycRegister } from '../../typechain'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../spacemart/assets/payload/fixtures/parentable.fixture'
import contractNames from '../../constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'

describe.skip('[kyc/kyc-setup]: KYC instantiation during root creation', () => {
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress

	before(
		'load fixtures/parentable`',
		async () => ({ payloadAsset, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	it('disallows setupKyc()', async () =>
		await expect(payloadAsset.connect(deployer).setupKyc(kycContract.address)).to.be.revertedWith(
			'can not change KYC register contract'
		))

	it('changes payload kycRegister from factory owner', async () => {
		const kycContract2 = await ethers
			.getContractFactory(contractNames.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		expect(await payloadAsset.kycRegister()).not.to.be.eq(kycContract2.address)

		const txr = await payloadAsset
			.connect(deployer)
			.changeKycRegister(kycContract2.address)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(await payloadAsset.kycRegister()).to.be.eq(kycContract2.address)
	})
})
