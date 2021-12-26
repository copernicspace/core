// SPDX-License-Identifier: private
pragma solidity 0.8.9;

import '@openzeppelin/contracts/utils/Context.sol';
import 'hardhat/console.sol';

contract KycRegister is Context {
    mapping(address => bool) public kycStatus;
    mapping(address => bool) public operatorAccess;
    address public currentAdmin;
    bool private _finalState;

    /*
        Admin:
        - get kycStatusInfo
        - set kycStatus
        - get operatorAccessInfo
        - add operator access
        - remove operator access
        - change admin address to another address

        Operator:
        - get kycStatusInfo
        - set kycStatus
        - get operatorAccessInfo

        User:
        - get kycStatusInfo
        - get operatorAccessInfo

        By default, there is only one admin address which can add/remove operator status
    */

    constructor() {
        // by default, the address initializing the contract is set to be an Admin address
        currentAdmin = _msgSender();
    }

    function changeAdmin(address newAdminAddress) public adminPermissions {
        currentAdmin = newAdminAddress;
    }

    function setOperatorStatus(address newOperatorAddress, bool isOperator) public adminPermissions {
        operatorAccess[newOperatorAddress] = isOperator;
    }

    function setKycStatus(address userAddress, bool kycValue) public operatorPermissions {
        kycStatus[userAddress] = kycValue;
    }

    function getKycStatusInfo(address userAddress) public view returns (bool) {
        return kycStatus[userAddress];
    }

    function getOperatorStatusInfo(address userAddress) public view returns (bool) {
        return operatorAccess[userAddress];
    }

    function finalize() internal {
        _finalState = true;
    }

    modifier finalizer() {
        require(!_finalState, 'Kyc: contract is already finalized');

        if(!_finalState) {
            _;
            finalize();
        }
    }

    modifier adminPermissions() {
        require(_msgSender() == currentAdmin, 'unauthorized -- only for admin');
        _;
    }

    modifier operatorPermissions() {
        require(
            operatorAccess[_msgSender()] || _msgSender() == currentAdmin,
            'unauthorized -- only for operators & admin'
        );
        _;
    }
}
