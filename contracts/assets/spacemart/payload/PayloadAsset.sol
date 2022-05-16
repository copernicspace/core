// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';

import '../../abstract/ParentableWithName.sol';
import '../../abstract/PausableAsset.sol';
import '../../abstract/Royalties.sol';
import '../../abstract/Decimals.sol';
import '../../abstract/KYC.sol';

import '../../../utils/GeneratorID.sol';

contract PayloadAsset is
    ERC1155,
    Initializable,
    AccessControl,
    PausableAsset,
    ParentableWithName,
    GeneratorID,
    Royalties,
    // Creator, is inherited via linerization from `PausableAsset`
    Decimals,
    KYC
{
    constructor(string memory uri) ERC1155(uri) {}

    function initialize(
        string memory _uri,
        string memory _name,
        uint256 _decimals,
        uint256 _totalSupply,
        address _creator,
        address _factoryOwner,
        uint256 _royalties,
        bool _locked
    ) external initializer {
        _setURI(_uri);

        _setDecimals(_decimals);

        totalSupply = _totalSupply;
        uint256 rootID = 0;
        _setName(rootID, _name);
        // set parent id to itself, because it is root asset
        _setParent(rootID, rootID);
        _setCreator(_creator);

        if (_royalties > 0) {
            _setRoyalties(_royalties);
        }
        _mint(_creator, rootID, totalSupply, '');
        _setPause(_locked);
        _setupRole(DEFAULT_ADMIN_ROLE, _factoryOwner);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    uint256 public totalSupply;

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, PausableAsset) {
        if (from != address(0)) {
            require(kycRegister.getKycStatusInfo(from), 'sender/seller is not on KYC list');
        }
        if (to != address(0)) {
            require(kycRegister.getKycStatusInfo(to), 'receiver/buyer is not on KYC list');
        }
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createChild(
        uint256 amount,
        uint256 pid,
        string memory name,
        address to
    ) external onlyCreator {
        uint256 id = generateId();
        _setName(id, name);
        _setParent(id, pid);
        _burn(_msgSender(), pid, amount);
        _mint(to, id, amount, '');
    }

    function burn(uint256 amount) external {
        _burn(_msgSender(), 0, amount);
    }
}
