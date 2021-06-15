import { ethers } from 'hardhat'
import { Asset } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

describe('[deploy.test.ts] Asset deploy test suite', () => {

	let assetContract: Asset
	before('deploy Asset contract', async () =>
		assetContract = await ethers.getContractFactory('Asset')
			.then(factory => factory.deploy('TEST-URI'))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as Asset))

	it('was deployed with OK receipt status', async () =>
		await assetContract.deployTransaction.wait()
			.then(deployReceipt =>
				expect(deployReceipt.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	// todo add assertion of contract's default values
})
