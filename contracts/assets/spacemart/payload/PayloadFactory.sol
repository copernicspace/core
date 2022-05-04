// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';

import './PayloadAsset.sol';
import '../../abstract/KYC.sol';

contract PayloadFactory is AccessControl {
    address public logicAddress;
    address public platformOperator;

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

    function create(
        string memory uri,
        string memory name,
        uint256 decimals,
        uint256 totalSupply,
        address kycRegisterAddress,
        uint256 royalties,
        bool locked
    ) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_CLIENT, _msgSender()),
            'You are not allowed to create new SpaceAsset:Payload'
        );
        address clone = Clones.clone(logicAddress);

        KYC(clone).setupKyc(kycRegisterAddress);

        PayloadAsset(clone).initialize(uri, name, decimals, totalSupply, _msgSender(), factoryOwner, royalties, locked);

        deployed.push(clone);

        emit CargoCreated(clone, _msgSender());
    }

    function addManager(address target) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'Only factory owner can add managers');
        grantRole(FACTORY_MANAGER, target);
    }

    function revokeManage(address target) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'Only factory owner can add managers');
        revokeRole(FACTORY_MANAGER, target);
        (FACTORY_MANAGER, target);
    }

    function addClient(address target) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_MANAGER, _msgSender()),
            'Only factory owner & managers can add clients'
        );
        grantRole(FACTORY_CLIENT, target);
    }

    function revokeClient(address target) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(FACTORY_MANAGER, _msgSender()),
            'Only factory owner & managers can add clients'
        );
        revokeRole(FACTORY_CLIENT, target);
    }
}
