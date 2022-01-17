// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import './CargoAsset.sol';
import '../../utils/CloneFactory.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

contract CargoFactory is CloneFactory, AccessControl, KycRegister {
    // address of deployed contract to clone from
    // this should be deployed `SpaceCargo` address
    address public logicAddress;

    // kyc register instance
    KycRegister private kycRegister;

    // role to define managers who can add clients
    bytes32 public constant FACTORY_MANAGER = keccak256('FACTORY_MANAGER');
    // role to define who can create new cargo
    bytes32 public constant FACTORY_CLIENT = keccak256('FACTORY_CLIENT');

    address[] public deployed;

    event CargoCreated(address indexed newCargoAddress, address indexed creator);

    constructor(address _logicAddress) {
        logicAddress = _logicAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function setTemplateAddress(address _logicAddress) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'Only factory owner can set template address');
        logicAddress = _logicAddress;
    }

    function createCargo(
        string memory _uri,
        string memory _name,
        uint256 _decimals,
        uint256 _totalSupply,
        KycRegister _kycRegister
    ) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_CLIENT, _msgSender()),
            'You are not allowed to create new SpaceCargo'
        );
        address clone = createClone(logicAddress);
        // todo make sure initizle can be called once

        // set up KYC for checks
        CargoAsset(clone)._setupKyc(_kycRegister);
        // before initialize make sure user is permitted to create cargo (Kyc permissions)
        require(CargoAsset(clone).kycRegister().getKycStatusInfo(msg.sender), 'user not on KYC list');
        // initialize cargo asset
        CargoAsset(clone).initialize(_uri, _name, _decimals, _totalSupply, _msgSender());

        deployed.push(clone);
        emit CargoCreated(clone, _msgSender());
    }

    function addManager(address manager) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'Only factory owner can add managers');
        grantRole(FACTORY_MANAGER, manager);
    }

    function addClient(address client) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_MANAGER, _msgSender()),
            'Only factory owner & managers can add clients'
        );
        grantRole(FACTORY_CLIENT, client);
    }

    function revokeClient(address client) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_MANAGER, _msgSender()),
            'Only factory owner & managers can add clients'
        );
        revokeRole(FACTORY_CLIENT, client);
    }
}
