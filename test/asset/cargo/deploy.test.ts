import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoFactory } from '../../../typechain'
import { deploy } from './fixtures/deploy.fixture'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Address } from 'cluster'

describe('[test/asset/cargo/deploy.test] CargoFactory for asset: deploy fixture test suite', () => {
	let user: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , user] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let kycContractAddress: string
	beforeEach('load fixtures/deploy`', async () => ({ cargoFactory, kycContractAddress } = await waffle.loadFixture(deploy)))

	it('has success tx receipt status', async () =>
		await cargoFactory.deployTransaction.wait().then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	it('reverts on `createCargo`, if user is not a factory client', async () =>
		await expect(
			cargoFactory.connect(user).createCargo('test.uri.com', 'TestSpaceCargoName', 18, '3500', kycContractAddress)
		).to.be.revertedWith('You are not allowed to create new SpaceCargo'))

	it('reverts if addClient called from non manager', async () => {
		await expect(cargoFactory.connect(user).addClient(user.address)).to.be.revertedWith(
			'Only factory owner & managers can add clients'
		)
	})
})
