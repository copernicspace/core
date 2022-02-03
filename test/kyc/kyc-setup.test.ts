import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import contractNames from '../../constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'

describe('[test/kyc/kyc-setup]: KYC instantiation during root creation', () => {
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress

	// create dedicated fixture laoder, to exclude KYC address changes in fixture chain
	const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

	before(
		'load fixtures/parentable`',
		async () => ({ cargoContract, kycContract, deployer } = await loadFixture(parentable))
	)

	it('disallows setupKyc()', async () =>
		await expect(cargoContract.connect(deployer).setupKyc(kycContract.address)).to.be.revertedWith(
			'can not change KYC register contract'
		))

	it('changes cargo kycRegister from factory owner', async () => {
		const kycContract2 = await ethers
			.getContractFactory(contractNames.KYC_REGISTER)
			.then(factory => factory.connect(deployer).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		expect(await cargoContract.kycRegister()).not.to.be.eq(kycContract2.address)

		const txr = await cargoContract
			.connect(deployer)
			.changeKycRegister(kycContract2.address)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		expect(await cargoContract.kycRegister()).to.be.eq(kycContract2.address)
	})
})
