// SPDX-License-Identifier: private
pragma solidity 0.8.9;

contract KymRegister {
    mapping(uint256 => bool) public kymStatus; // maps [asset id] to [true/false]
    mapping(address => bool) public operatorAccess;
    address public currentAdmin;
    address private assetAddress; // is responsible for linking kym contract to asset contract

    constructor(address _assetAddress) {
        currentAdmin = msg.sender;
        assetAddress = _assetAddress;
    }

    function getAssetAddress() public view returns (address) {
        return assetAddress;
    }

    function changeAdmin(address newAdminAddress) public adminPermissions {
        currentAdmin = newAdminAddress;
    }

    function setOperatorStatus(address newOperatorAddress, bool isOperator)
        public
        adminPermissions
    {
        operatorAccess[newOperatorAddress] = isOperator;
    }

    function setKymStatus(uint256 assetID, bool kymValue)
        public
        operatorPermissions
    {
        kymStatus[assetID] = kymValue;
    }

    function getKymStatusInfo(uint256 assetID) public view returns (bool) {
        return kymStatus[assetID];
    }

    function getOperatorStatusInfo(address userAddress)
        public
        view
        returns (bool)
    {
        return operatorAccess[userAddress];
    }

    modifier adminPermissions() {
        require(msg.sender == currentAdmin, 'unauthorized -- only for admin');
        _;
    }

    modifier operatorPermissions() {
        require(
            operatorAccess[msg.sender] || msg.sender == currentAdmin,
            'unauthorized -- only for operators & admin'
        );
        _;
    }
}
