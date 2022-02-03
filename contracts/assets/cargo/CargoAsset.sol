// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';

import './PausableCargo.sol';
import './ParentableCargo.sol';
import '../../utils/GeneratorID.sol';
import '../../kyc/KycRegister.sol';

contract CargoAsset is ERC1155, PausableCargo, ParentableCargo, Initializable, GeneratorID, AccessControl {
    uint256 public royalties;

    constructor(string memory uri) ERC1155(uri) {}

    KycRegister public kycRegister;
    bool private kycExist = false;

    /**
     * instead off constructor for CloneFactory
     */
    function initialize(
        string memory _uri,
        string memory _name,
        uint256 _decimals,
        uint256 _totalSupply,
        address _owner,
        address _factoryOwner,
        uint256 _royalties
    ) external initializer {
        _setURI(_uri);
        decimals = _decimals;
        totalSupply = _totalSupply;
        uint256 rootID = 0;
        _names[rootID] = _name;
        _parents[rootID] = rootID;
        creator = _owner;
        if (_royalties > 0) {
            royalties = _royalties;
        }
        _mint(_owner, rootID, totalSupply, '');
        _setupRole(DEFAULT_ADMIN_ROLE, _factoryOwner);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setupKyc(address kycRegisterAddress) external {
        require(!kycExist, 'can not change KYC register contract');
        kycRegister = KycRegister(kycRegisterAddress);
        kycExist = true;
    }

    function changeKycRegister(address kycRegisterAddress) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), 'You are not allowed to change KYC register');
        kycRegister = KycRegister(kycRegisterAddress);
    }

    uint256 public decimals;
    uint256 public totalSupply;

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, PausableCargo) {
        if (from != address(0)) {
            require(kycRegister.getKycStatusInfo(from), 'user not on KYC list');
        }
        if (to != address(0)) {
            require(kycRegister.getKycStatusInfo(to), 'user not on KYC list');
        }
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createChild(
        uint256 amount,
        uint256 pid,
        string memory name,
        address to
    ) external override(Parentable) onlyCreator {
        uint256 id = generateId();
        _names[id] = name;
        _burn(_msgSender(), pid, amount);
        _mint(to, id, amount, '');
        emit NewParent(id, pid, amount);
    }

    function burn(uint256 amount) external onlyCreator {
        _burn(_msgSender(), 0, amount);
    }

    function transfer(
        address to,
        uint256 id,
        uint256 amount
    ) public {
        safeTransferFrom(_msgSender(), to, id, amount, '');
    }

    function transferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) public {
        safeTransferFrom(from, to, id, amount, '');
    }
}
