// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '../../kyc/KycRegister.sol';

abstract contract KYC is AccessControl {
    KycRegister public kycRegister;
    bool private kycExist = false;

    function setupKyc(address kycRegisterAddress) public {
        require(!kycExist, 'can not change KYC register contract');
        kycRegister = KycRegister(kycRegisterAddress);
        kycExist = true;
    }

    function changeKycRegister(address kycRegisterAddress) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'You are not allowed to change KYC register');
        kycRegister = KycRegister(kycRegisterAddress);
    }
}
