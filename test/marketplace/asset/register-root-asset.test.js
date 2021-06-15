// const { accounts, contract } = require('@openzeppelin/test-environment')
// const { expectEvent, constants } = require('@openzeppelin/test-helpers')
// import { getAssetId } from '../../helpers/new-asset-id.helper'
//
// const Asset = contract.fromArtifact('AssetParentable')
// const [owner] = accounts
//
// describe('Register root public asset', function () {
// 	beforeEach(async function () {
// 		this.uri = 'HTTP://TEST_URI'
// 		this.asset = await Asset.new(this.uri)
// 		this.txr = await this.asset.createRoot(true, { from: owner })
// 	})
//
// 	it('correct event emitted after register transaction', async function () {
// 		expectEvent(this.txr, 'TransferSingle', {
// 			operator: owner,
// 			from: constants.ZERO_ADDRESS,
// 			to: owner,
// 			id: getAssetId(this.txr),
// 			value: '1'
// 		})
// 	})
// })
