// const { accounts, contract } = require("@openzeppelin/test-environment");
// const { BN, expectRevert } = require("@openzeppelin/test-helpers");
// const { expect } = require("chai");
//
// const KycContract = contract.fromArtifact("KycRegister");
// const startAdmin = accounts[0];
// const newAdmin = accounts[2];
// const user = accounts[1];
// const operator = accounts[7];
//
// let kycContract;
//
// describe('Kyc Register Contract', () => {
//
//     before(async () => {
//
//         kycContract = await KycContract.new({ from: startAdmin })
//
//     });
//
//     it('deploys a contract', () => {
//
//         const address = kycContract.address;
//         expect(address).to.be.string;
//         expect(address).to.have.lengthOf(42);
//
//     })
//
//     it('sets the default status of the address deploying it as admin', async () => {
//
//         expect(await kycContract.currentAdmin()).to.be.equal(startAdmin);
//
//     });
//
//     it('sets the default operator access status of every address as false', async () => {
//
//         // for every of the 10 test addresses
//         for(var i=0; i<10; i++) {
//
//             if(accounts[i] == startAdmin) {
//                 continue;
//             }
//             expect(await kycContract.getOperatorStatusInfo(accounts[i])).to.be.equal(false);
//         }
//         // admin address does not have an operator status by default, and adding/removing operator status
//         // from the address defined as currentAdmin does not change any of the functionality
//
//     });
//
//     it('sets the default kyc status of every address as false', async () => {
//
//         // for every of the 10 test addresses
//         for(var i=0; i<10; i++) {
//             expect(await kycContract.getKycStatusInfo(accounts[i])).to.be.equal(false);
//         }
//
//     });
//
//     it('allows the admin to change the admin address', async () => {
//
//         const startAdminAddress = await kycContract.currentAdmin();
//         expect(startAdminAddress).to.be.equal(startAdmin);
//
//         await kycContract.changeAdmin(newAdmin, { from: startAdmin });
//
//         const endAdminAddress = await kycContract.currentAdmin();
//         expect(endAdminAddress).to.be.equal(newAdmin);
//
//         expect(endAdminAddress).not.to.be.equal(startAdmin);
//
//     });
//
//     // admin address changed to newAdmin (which is accounts[2]) by this point
//
//     it('allows the admin to set operator access status', async() => {
//
//         // 1. setting operator access to [true]
//         const startOPStatus = await kycContract.getOperatorStatusInfo(operator);
//
//         await kycContract.setOperatorStatus(operator, true, { from: newAdmin });
//
//         const endOPStatus = await kycContract.getOperatorStatusInfo(operator);
//
//         expect(endOPStatus).not.to.be.equal(startOPStatus);
//         expect(endOPStatus).to.be.equal(true);
//
//         // 2. setting operator access to [false]
//         const startOPStatus_ = await kycContract.getOperatorStatusInfo(operator);
//
//         await kycContract.setOperatorStatus(operator, false, { from: newAdmin });
//
//         const endOPStatus_ = await kycContract.getOperatorStatusInfo(operator);
//
//         expect(endOPStatus_).not.to.be.equal(startOPStatus_);
//         expect(endOPStatus_).to.be.equal(false);
//
//     })
//
//     it('allows the operator to set the kyc status of an account', async () => {
//
//         // need to set operator's operator status as true
//         await kycContract.setOperatorStatus(operator, true, { from: newAdmin });
//
//         // testing the function itself
//         const startKYCstatus = await kycContract.getKycStatusInfo(user);
//
//         await kycContract.setKycStatus(user, true, { from: operator });
//
//         const endKYCstatus = await kycContract.getKycStatusInfo(user);
//
//         expect(endKYCstatus).not.to.be.equal(startKYCstatus);
//         expect(endKYCstatus).not.to.be.equal(false);
//
//     });
//
//     it('allows the admin to set the kyc status of an account', async () => {
//
//         const startKYCstatus = await kycContract.getKycStatusInfo(user);
//
//         await kycContract.setKycStatus(user, false, { from: newAdmin });
//
//         const endKYCstatus = await kycContract.getKycStatusInfo(user);
//
//         expect(endKYCstatus).not.to.be.equal(startKYCstatus);
//         expect(endKYCstatus).not.to.be.equal(true);
//
//     });
//
//     it('disallows non-operators from setting kyc status', async () => {
//
//         await expectRevert(kycContract.setKycStatus(user, true, { from: user }), "unauthorized -- only for operators & admin");
//     });
//
//     it('disallows non-admins from setting operator access status', async () => {
//         // user
//         await expectRevert(kycContract.setOperatorStatus(user, true, { from: user }), "unauthorized -- only for admin");
//         // operator
//         await expectRevert(kycContract.setOperatorStatus(user, true, { from: operator }), "unauthorized -- only for admin");
//     });
// });
