//
//
// const { accounts, contract } = require('@openzeppelin/test-environment')
// const { expectRevert } = require('@openzeppelin/test-helpers')
// const { expect } = require('chai')
// const { TX_RECEIPT } = require('../../constants/tx-receipt-status')
// const { getAssetId } = require('../../helpers/new-asset-id.helper')
//
// const [owner, userA, userB, userC, userX] = accounts
// const Asset = contract.fromArtifact('AssetParentable')
//
// describe('private asset derivation', () => {
//
//     before('deploy asset contract', async () => {
//         // deploy asset contract
//         this.asset = await Asset.new('test/uri', { from: owner })
//         // create public root asset
//         let cpra = await this.asset.createRoot(false, { from: userA })
//         // assert success of root asset creation tx
//         expect(cpra.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//         // get root asset id for further usage as parent
//         this.parentId = getAssetId(cpra)
//     })
//
//     it('create new asset by not allowed userB -- should be reverted', async () => {
//         let cpa = this.asset.create(
//             this.parentId,
//             false,
//             { from: userB })
//         await expectRevert(cpa, 'Can\'t create new asset, based on selected as parent')
//     })
//
//     it('try to \'allow\' from not owner, should be reverted', async () => {
//         let allow_tx = this.asset.allow(userB, this.parentId, { from: userX })
//         await expectRevert(allow_tx, 'Not owner')
//     })
//
//     it('allow userB to create asset based on parentId', async () => {
//         let allow_tx = await this.asset.allow(userB, this.parentId, { from: userA })
//         expect(allow_tx.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//         expect(await this.asset.isAllowed(this.parentId, userB)).to.be.eq(true)
//     })
//
//     it('create child asset based on private parent asset', async () => {
//         let cpa = await this.asset.create(
//             this.parentId,
//             false,
//             { from: userB })
//         // assert success of asset creations
//         expect(cpa.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//         // save child id
//         this.childId = getAssetId(cpa)
//
//     })
//
//     it('correct parent id of new child asset', async () => {
//         expect(await this.asset.getParentID(this.childId)).to.be.bignumber.equal(this.parentId)
//     })
//
//
//     it('create new asset by not allowed userC -- should be reverted', async () => {
//         let cpa = this.asset.create(
//             this.parentId,
//             false,
//             { from: userC })
//
//         await expectRevert(cpa, 'Can\'t create new asset, based on selected as parent')
//     })
//
//     it('allow userC to create asset based on childId', async () => {
//         let allow_tx = await this.asset.allow(userC, this.childId, { from: userB })
//         expect(allow_tx.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//         expect(await this.asset.isAllowed(this.parentId, userB)).to.be.eq(true)
//     })
//
//     it('third user can choose child asset as parent for a new one', async () => {
//         // create public assets, based on public asset
//         let cpa = await this.asset.create(
//             this.childId,
//             true,
//             { from: userC })
//         // assert success of asset creations
//         expect(cpa.receipt.status).to.be.eq(TX_RECEIPT.SUCCESS)
//         // save child child id
//         this.childChildId = getAssetId(cpa)
//     })
//
//     it('correct parent id of new child child asset', async () => {
//         expect(await this.asset.getParentID(this.childChildId)).to.be.bignumber.equal(this.childId)
//     })
// })
