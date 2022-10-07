// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

import '../../common/abstract/ParentableWithName.sol';
import '../../common/abstract/PausableAsset.sol';
import '../../common/abstract/Royalties.sol';
import '../../common/abstract/Decimals.sol';
import '../../common/abstract/KYC.sol';
import '../../utils/GeneratorID.sol';

contract PayloadAsset is
    ERC1155URIStorage,
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
        bool _locked,
        string memory cid
    ) external initializer {
        _setDecimals(_decimals);
        totalSupply = _totalSupply;
        uint256 rootID = 0;
        _setName(rootID, _name);
        // set parent id to itself, because it is root asset
        _setParent(rootID, rootID);
        _setCreator(_creator);

        if (_royalties > 0) {
            _setRootRoyalties(_royalties);
        }
        _mint(_creator, rootID, totalSupply, '');
        _setBaseURI(_uri);
        _setURI(rootID, cid);
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
    ) internal virtual override(ERC1155) {
        if (from != address(0)) {
            require(kycRegister.getKycStatusInfo(from), 'sender/seller is not on KYC list');
        }
        if (to != address(0)) {
            require(kycRegister.getKycStatusInfo(to), 'receiver/buyer is not on KYC list');
        }

        require(operator == creator || from == creator || !paused(), 'Pausable: asset is locked');

        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createChild(
        uint256 amount,
        uint256 burnAmount,
        uint256 pid,
        string memory name,
        address to,
        string memory cid,
        uint256 sroyalties
    ) external onlyCreator {
        uint256 id = generateId();
        _setName(id, name);
        _setParent(id, pid);
        _burn(_msgSender(), pid, burnAmount);
        _mint(to, id, amount, '');
        _setURI(id, cid);
        _setSecondaryRoyalties(id, to, sroyalties);
        emit NewParent(id, pid, amount);
    }

    function burn(uint256 amount) external {
        _burn(_msgSender(), 0, amount);
    }
}
