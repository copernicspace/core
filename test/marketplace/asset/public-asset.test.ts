import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[public-asset.test.ts] public asset derivation test suite', () => {
	let deployer, userA, userB: SignerWithAddress
	before('get signers from hh node', async () =>
		[deployer, userA, userB] = await ethers.getSigners())

	let assetContract: Asset
	before('deploy asset contract', async () =>
		assetContract = await ethers.getContractFactory('Asset')
			.then(factory => factory.connect(deployer).deploy('TEST-URI'))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as Asset))
	it('deployed asset contract successfully', async () =>
		await assetContract.deployTransaction.wait()
			.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	let rootAssetTxr: ContractReceipt
	before('create root asset and get ID of new token', async () =>
		rootAssetTxr = await assetContract.connect(userA).createRoot(true, false, 0)
			.then(tx => tx.wait()))
	it('created Root Asset successfully', async () =>
		expect(await (rootAssetTxr.status)).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

	let rootAssetID: BigNumber
	before('extract new root asset ID from tx receipt event', async () =>
		rootAssetID = getAssetID(rootAssetTxr))
	it('has correct new root asset ID', async () =>
		expect(rootAssetID).to.be.equal('1'))

	let childAssetTxr: ContractReceipt
	let childID: BigNumber
	it('creates child asset based on root asset from another user', async () => {
		childAssetTxr = await assetContract.connect(userB)
			.create(rootAssetID, true, false, 0)
			.then(tx => tx.wait())
		expect(childAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		childID = getAssetID(childAssetTxr)
	})

	it('has correct new child asset ID', async () =>
		expect(await childID).to.be.equal('2'))

	it('has correct parent id of new child asset', async () =>
		expect(await assetContract.getParentID(childID)).to.be.equal(rootAssetID))

	let grandChildAssetTxr: ContractReceipt
	let grandChildID: BigNumber
	it('allows to choose child asset as parent for a new one', async () => {
		grandChildAssetTxr = await assetContract.create(childID, true, false, 0)
			.then(tx => tx.wait())
		expect(grandChildAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		grandChildID = getAssetID(grandChildAssetTxr)
	})

	it('has correct parent id of new child child asset', async () =>
		expect(await assetContract.getParentID(grandChildID)).to.be.equal(childID))
})
