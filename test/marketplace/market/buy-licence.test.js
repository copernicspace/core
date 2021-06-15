// const { accounts, contract } = require('@openzeppelin/test-environment')
// const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
// const { expect } = require('chai')
// const { getSellId } = require('../../helpers/sell-id.helper')
// const { getAssetId } = require('../../helpers/new-asset-id.helper')
// const { TX_RECEIPT } = require('../../constants/tx-receipt-status')
// const { TX_LICENSE_ID_START } = require('../../constants/tx-license-id-start')
//
//
// const [seller, buyer] = accounts
// const Asset = contract.fromArtifact('AssetParentableLicensable') // Loads a compiled contract
// const ERC20Mock = contract.fromArtifact('ERC20Mock')
// const Market = contract.fromArtifact('Market')
//
// describe('Sell asset licence test', async () => {
//
//     // constants
//     this.sellPrice = new BN(1000000)
//
//     before('deploy contracts', async () => {
//
//         this.asset = await Asset.new('test/uri')
//         this.market = await Market.new(this.asset.address)
//         this.money = await ERC20Mock.new()
//     })
//
//     before('top up buyer with money', async () => {
//
//         await this.money.transfer(buyer, this.sellPrice)
//     })
//
//     before('create root asset', async () => {
//
//         let txr = await this.asset.createRoot(false, { from: seller })
//         this.assetId = getAssetId(txr)
//     })
//
//     before('allow the market to create licences based on seller\'s tokens', async () => {
//
//         await this.asset.allow(this.market.address, this.assetId, { from: seller })
//     })
//
//     before('create licence offer', async () => {
//
//         this.sellLicenceTxs = await this.market.sellLicence(
//             this.assetId,
//             this.sellPrice,
//             this.money.address,
//             0,
//             { from: seller }
//         )
//     })
//
//     it('allows market to create licences', async () => {
//
//         expect(await this.asset.isAllowed(this.assetId, this.market.address)).to.be.eq(true)
//     })
//
//     it('sets the correct sell licence tx status', async () => {
//
//         expect(this.sellLicenceTxs.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//     })
//
//     it('sets the correct root asset id', async () => {
//
//         expect(this.assetId).to.be.bignumber.equal(new BN(1))
//     })
//
//     it('sets the correct balance of seller', async () => {
//
//         expect(await this.asset.balanceOf(seller, this.assetId)).to.be.bignumber.equal('1')
//     })
//
//     it('sets the correct sell id', async () => {
//
//         this.sellLicenseID = await getSellId(this.sellLicenceTxs)
//         this.expectedSellLicenceID = TX_LICENSE_ID_START
//         expect(this.sellLicenseID).to.be.bignumber.equal(this.expectedSellLicenceID)
//     })
//
//     it('adds correct new smart offer to storage', async () => {
//
//         const result = await this.market.getSmartOffer(this.sellLicenseID)
//         expect(result).to.have.property('seller', seller)
//         expect(result.what).to.be.bignumber.equal(this.assetId)
//         expect(result.price).to.be.bignumber.equal(this.sellPrice)
//         expect(result).to.have.property('money', this.money.address)
//         expect(result.sellID).to.be.bignumber.equal(this.expectedSellLicenceID)
//     })
//
//     // buyer:
//
//     it('carries out a successful buy transaction', async () => {
//
//         let approveTrx = await this.money.approve(
//             this.market.address,
//             this.sellPrice,
//             { from: buyer }
//         )
//         expectEvent(approveTrx, 'Approval', {
//             owner: buyer,
//             spender: this.market.address,
//             value: this.sellPrice
//         })
//
//         this.buyTxr = await this.market.buyLicence(this.sellLicenseID, { from: buyer })
//         // todo fix expected event asset
//         // cant use 'expectEvent' it does not decode nested logs with events
//         expectEvent(this.buyTxr, 'NewLicence', {
//             buyer: buyer,
//             seller: seller,
//             newLicenceId:  TX_LICENSE_ID_START.add(new BN('2'))
//             // plus 2 because nonce is used for licence, was preincremented for root asset, and now for licence
//         })
//
//         /*
//             the following doesn't currently work with the test environment
//             because the logs only contain top-level transaction events and don't include any events from other transactions
//             that are nested within the top-level transaction
//
//             these transactions, however, get executed and return events with all the correct data in rawLogs
//             it is a problem of the test environment that doesn't decode the data
//
//             =====================================
//             expectEvent(buyTxr, "NewLicence", {
//                 parent: this.assetId,
//                 id: this.sellLicenseID,
//                 from: this.seller,
//                 to: this.buyer
//             });
//             =====================================
//         */
//
//         expect(await this.buyTxr.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//     })
//
//     it('sets the correct token balance of buyer', async () => {
//
//         // obtain the id of minted token after the buy licence transaction is completed
//         // needed to check the buyer's balance
//         this.mintedTokenID =  this.buyTxr.receipt.logs[0].args.newLicenceId
//         expect(this.mintedTokenID).to.be.bignumber
//         expect(await this.asset.isLicence(this.mintedTokenID)).to.be.true
//         expect(await this.asset.balanceOf(buyer, this.mintedTokenID)).to.be.bignumber.equal('1')
//         expect(await this.asset.balanceOf(seller, this.mintedTokenID)).to.be.bignumber.equal('0')
//     })
//
//     it('transfers the correct amount of funds between buyer and seller', async() => {
//
//         expect(await this.money.balanceOf(buyer)).to.be.bignumber.equal('0')
//         expect(await this.money.balanceOf(seller)).to.be.bignumber.equal(this.sellPrice)
//     })
//
//     it('disallows the buyer to carry out the buy transaction again', async () => {
//
//         await this.money.transfer(buyer, this.sellPrice)
//
//         let approveTrx = await this.money.approve(
//             this.market.address,
//             this.sellPrice,
//             { from: buyer }
//         )
//         expectEvent(approveTrx, 'Approval', {
//             owner: buyer,
//             spender: this.market.address,
//             value: this.sellPrice
//         })
//
//         // seller's balance of given token should be 0, expect revert
//         expectRevert(this.market.buy(TX_LICENSE_ID_START, { from: buyer }), 'ERC1155: insufficient balance for transfer')
//
//     })
//
// })
