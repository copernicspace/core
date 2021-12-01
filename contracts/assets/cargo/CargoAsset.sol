// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';

import './PausableCargo.sol';
import './ParentableCargo.sol';
import '../../utils/GeneratorID.sol';
import 'hardhat/console.sol';
import '../../kyc/KycRegister.sol';

contract CargoAsset is ERC1155, PausableCargo, ParentableCargo, Initializable, GeneratorID, KycRegister {
    constructor(string memory uri) ERC1155(uri) {}

    KycRegister public kycRegister;
    bool private isInit;

    /**
     * instead off constructor for CloneFactory
     */
    function initialize(
        string memory _uri,
        string memory _name,
        uint256 _decimals,
        uint256 _totalSupply,
        address _owner
    ) external initializer {
        _setURI(_uri);
        decimals = _decimals;
        totalSupply = _totalSupply;
        uint256 rootID = 0;
        _names[rootID] = _name;
        _parents[rootID] = rootID;
        creator = _owner;
        _mint(_owner, rootID, totalSupply, '');
        isInit = true;
    }

    // Kyc setup must be called before initialize
    // (before first transaction -- mint)
    function _setupKyc(KycRegister _kycRegister) external {
        require(!isInit, 'kyc already set up - cannot initialize again');
        kycRegister = _kycRegister;
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
        // require(kycRegister.getKycStatusInfo(to) || to == address(0), 'user not on KYC list');
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

    function send(
        address to,
        uint256 id,
        uint256 amount
    ) public {
        safeTransferFrom(_msgSender(), to, id, amount, '');
    }

    function sendFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) public {
        safeTransferFrom(from, to, id, amount, '');
    }
}
