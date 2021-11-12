// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import './CargoAsset.sol';
import '../../utils/CloneFactory.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

contract CargoFactory is IERC1155Receiver, CloneFactory, AccessControl {
    // address of deployed contract to clone from
    // this should be deployed `SpaceCargo` address
    address public templateAddress;

    // role to define managers who can add clients
    bytes32 public constant FACTORY_MANAGER = keccak256('FACTORY_MANAGER');
    // role to define who can create new cargo
    bytes32 public constant FACTORY_CLIENT = keccak256('FACTORY_CLIENT');

    event CargoCreated(address newCargoAddress);

    constructor(address _templateAddress) {
        templateAddress = _templateAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setTemplateAddress(address _templateAddress) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 'Only factory owner can set template address');
        templateAddress = _templateAddress;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function createCargo(
        string memory _uri,
        string memory _name,
        uint256 _decimals,
        uint256 _totalSupply
    ) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(FACTORY_CLIENT, msg.sender),
            'You are not allowed to create new SpaceCargo'
        );
        address clone = createClone(templateAddress);
        // todo make sure initizle can be called once
        CargoAsset(clone).initialize(_uri, _name, _decimals, _totalSupply);
        emit CargoCreated(clone);
    }

    function addManager(address manager) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 'Only factory owner can add managers');
        grantRole(FACTORY_MANAGER, manager);
    }

    function addClient(address client) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(FACTORY_MANAGER, msg.sender),
            'Only factory owner can add managers'
        );
        grantRole(FACTORY_MANAGER, client);
    }
}
