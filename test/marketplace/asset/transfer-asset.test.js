// const { accounts, contract } = require('@openzeppelin/test-environment')
// const { BN } = require('@openzeppelin/test-helpers')
// const { expect } = require('chai')
// const { getAssetId } = require('../../helpers/new-asset-id.helper')
// const { TX_RECEIPT } = require('../../constants/tx-receipt-status')
//
// const [owner, sender, recipient] = accounts
// const Asset = contract.fromArtifact('AssetParentable')
//
// describe('transfer root asset to another address', () => {
// 	before(async () => {
// 		this.uri = 'HTTP://TEST_URI'
// 		this.assetContract = await Asset.new(this.uri, { from: owner })
// 		let tx = await this.assetContract.createRoot(true, { from: sender })
// 		this.id = getAssetId(tx)
// 		let txrTransfer = await this.assetContract.send(
// 			recipient, this.id, { from: sender })
// 		expect(txrTransfer.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//
// 	})
// 	it('recipient owns root asset after transfer', async () => {
// 		expect(await this.assetContract.balanceOf(recipient, this.id))
// 			.to.be.bignumber.equal(new BN(1))
// 	})
// })
//
// describe('transfer non-root asset to another address', () => {
// 	before(async () => {
// 		this.uri = 'HTTP://TEST_URI'
// 		this.assetContract = await Asset.new(this.uri, { from: owner })
// 		let createRootTx = await this.assetContract.createRoot(true, { from: sender })
// 		let rootId = getAssetId(createRootTx)
// 		let createChildTx = await this.assetContract.create(rootId, false, { from: sender })
// 		this.childId = getAssetId(createChildTx)
// 		this.txrTransfer = await this.assetContract.send(
// 			recipient, this.childId, { from: sender })
// 	})
//
// 	it('recipient owns non-root asset after transfer', async () => {
// 		expect(await this.assetContract.balanceOf(recipient, this.childId))
// 			.to.be.bignumber.equal(new BN(1))
// 	})
// })
//
