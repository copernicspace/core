// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

import './CargoAsset.sol';
import '../../utils/CloneFactory.sol';

contract CargoFactory is CloneFactory, AccessControl {
    address public logicAddress;
    address public  platformOperator;

    address private factoryOwner;

    KycRegister private kycRegister;

    // role to define managers who can add clients
    bytes32 public constant FACTORY_MANAGER = keccak256('FACTORY_MANAGER');
    // role to define who can create new asset
    bytes32 public constant FACTORY_CLIENT = keccak256('FACTORY_CLIENT');

    address[] public deployed;

    event CargoCreated(address indexed newCargoAddress, address indexed creator);

    constructor(address _logicAddress) {
        logicAddress = _logicAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        factoryOwner = _msgSender();
        platformOperator = _msgSender();
    }

    function setTemplateAddress(address _logicAddress) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'Only factory owner can set template address');
        logicAddress = _logicAddress;
    }

    function createCargo(
        string memory uri,
        string memory name,
        uint256 decimals,
        uint256 totalSupply,
        address kycRegisterAddress,
        uint128 royalties
    ) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_CLIENT, _msgSender()),
            'You are not allowed to create new SpaceCargo'
        );
        address clone = createClone(logicAddress);
        CargoAsset(clone).setupKyc(kycRegisterAddress);
        require(CargoAsset(clone).kycRegister().getKycStatusInfo(msg.sender), 'user not on KYC list');
        CargoAsset(clone).initialize(uri, name, decimals, totalSupply, _msgSender(),factoryOwner, royalties, platformOperator);
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
