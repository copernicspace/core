const { accounts, contract } = require("@openzeppelin/test-environment");
const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
import { getAssetId } from "../helpers/new-asset-id.helper";

const KymContract = contract.fromArtifact("KymRegister");
const AssetContract = contract.fromArtifact("AssetParentable");

// accounts/addresses used in testing:
const startAdmin = accounts[0];
const newAdmin = accounts[2];
const operator = accounts[7];
const owner1 = accounts[1]; // owner of asset 1
const owner2 = accounts[3]; // owner of asset 2
const user = accounts[9];

let kymContract;
let assetContract;
let txr1;
let txr2;
let id1;
let id2;

describe('Kym Register Contract', () => {

    before(async () => {

        // create an instance of an asset
        assetContract = await AssetContract.new("test/uri");
        kymContract = await KymContract.new(assetContract.address, { from: startAdmin });

        // await receipt data
        txr1 = await assetContract.createRoot(true, { from: owner1 });   // create token 1 and assign to account: owner1
        txr2 = await assetContract.createRoot(true, { from: owner2 });   // create token 2 and assign to account: owner2

        // extract id of asset
        id1 = getAssetId(txr1);
        id2 = getAssetId(txr2);

    });

    it('deploys a kym contract', () => {

        // get the address of the deployed contract and check if it has a proper structure
        const address = kymContract.address;
        expect(address).to.be.string;
        expect(address).to.have.lengthOf(42);

    });

    it("the assets' IDs are big-number integers", async () => {
        // check if the ids of assets are of type bigNumber and are equal to 0 and 1
        expect(id1).to.be.bignumber.equal(new BN(1))
        expect(id2).to.be.bignumber.equal(new BN(2));
    });

    it('sets the default status of the address deploying it as admin', async () => {
        // await the currentAdmin field/variable
        const currentAdmin = await kymContract.currentAdmin();

        // test if the current admin of the contract is equal to startAdmin, from which the contract was deployed 
        expect(currentAdmin).to.be.equal(startAdmin);

    });

    it('sets the default operator access status of every address as false', async () => {
        // for every of the 10 test addresses test if the operator status is set to false
        for (var i = 0; i < 10; i++) {
            expect(await kymContract.getOperatorStatusInfo(accounts[i])).to.be.equal(false);
        }
        /* 
            admin address does not have an operator status by default, and adding/removing operator status
            from the address defined as currentAdmin does not change any of the functionality
            as the admin address has all the privelages regardless of whether it's defined as operator or not
        */
    });

    it('sets the default kym status of the deployed assets as false', async () => {
        // await status info for the 2 deployed assets
        const status1 = await kymContract.getKymStatusInfo(id1, { from: owner1 });
        const status2 = await kymContract.getKymStatusInfo(id2, { from: owner2 });

        expect(status1).to.be.false;
        expect(status2).to.be.false;

    });


    it('allows the admin to change the admin address', async () => {
        // test if the current admin address is equal to the address from which the kym contract was deployed
        const startAdminAddress = await kymContract.currentAdmin();
        expect(startAdminAddress).to.be.equal(startAdmin);

        // change the admin to newAdmin
        await kymContract.changeAdmin(newAdmin, { from: startAdmin });

        // test if the updated current admin address is equal to the new address it was set to
        const endAdminAddress = await kymContract.currentAdmin();
        expect(endAdminAddress).to.be.equal(newAdmin);
        expect(endAdminAddress).not.to.be.equal(startAdmin);

    });

    it('allows the admin to set operator access status', async () => {
        // setting operator access to true & declaring start & end status constants for testing
        const startOPStatus = await kymContract.getOperatorStatusInfo(operator);
        await kymContract.setOperatorStatus(operator, true, { from: newAdmin });
        const endOPStatus = await kymContract.getOperatorStatusInfo(operator);

        expect(endOPStatus).not.to.be.equal(startOPStatus);
        expect(endOPStatus).to.be.equal(true);

        // setting operator access to false & declaring start & end status constants for testing
        const startOPStatus_ = await kymContract.getOperatorStatusInfo(operator);
        await kymContract.setOperatorStatus(operator, false, { from: newAdmin });
        const endOPStatus_ = await kymContract.getOperatorStatusInfo(operator);

        expect(endOPStatus_).not.to.be.equal(startOPStatus_);
        expect(endOPStatus_).to.be.equal(false);

    })

    it('allows the operator to set the kym status of an asset', async () => {
        // need to set operator's operator status as true
        await kymContract.setOperatorStatus(operator, true, { from: newAdmin });

        // awaiting start kym status of 2 assets
        const start1status = await kymContract.getKymStatusInfo(id1);
        const start2status = await kymContract.getKymStatusInfo(id2);

        // changing the kym status of first asset (id1)
        await kymContract.setKymStatus(id1, true, { from: operator })

        // awaiting end kym status of 2 assets
        const end1status = await kymContract.getKymStatusInfo(id1);
        const end2status = await kymContract.getKymStatusInfo(id2);

        expect(start1status).not.to.be.equal(end1status);   // asset with id1 had its kym status changed
        expect(start2status).to.be.equal(end2status);       // asset with id2 did not receive kym status updates

        expect(end1status).to.be.equal(true);
        expect(end2status).to.be.equal(false);

    });

    it('allows the admin to set the kym status of an account', async () => {
        // setting kym status to true & declaring start & end status constants for testing
        const startKYMstatus = await kymContract.getKymStatusInfo(id2);
        await kymContract.setKymStatus(id2, true, { from: newAdmin });
        const endKYMstatus = await kymContract.getKymStatusInfo(id2);

        expect(endKYMstatus).not.to.be.equal(startKYMstatus);
        expect(endKYMstatus).to.be.equal(true);

    });

    it('disallows non-operators from setting kym status', async () => {
        // expecting a revert message to be as following
        await expectRevert(kymContract.setKymStatus(id1, false, { from: user }), "unauthorized -- only for operators & admin");
    });

    it('disallows non-admins from setting operator access status', async () => {
        // testing for user
        await expectRevert(kymContract.setOperatorStatus(user, false, { from: user }), "unauthorized -- only for admin");
        // testing for operator
        await expectRevert(kymContract.setOperatorStatus(user, false, { from: operator }), "unauthorized -- only for admin");
    });

});