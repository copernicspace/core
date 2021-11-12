// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import './PausableCargo.sol';
import './ParentableCargo.sol';
import './ClonableCargo.sol';
import '../../utils/GeneratorID.sol';
import 'hardhat/console.sol';

contract CargoAsset is ERC1155, PausableCargo, ParentableCargo, ClonableCargo, GeneratorID {
    uint256 public childPID = generateId(); // 1
    uint256 public grantChildPid = generateId(); // 2

    constructor(string memory uri) ERC1155(uri) {}

    /**
     * instead off constructor for CloneFactory
     */
    function initialize(
        string memory _uri,
        string memory _name,
        uint256 _decimals,
        uint256 _totalSupply
    ) external override(ClonableCargo) {
        _setURI(_uri);
        name = _name;
        decimals = _decimals;
        totalSupply = _totalSupply;
        uint256 rootID = childPID;  // BUG: assigns zero, even though childPID is NOT zero
        _parents[rootID] = 0; // root has 0 as pid
        _mint(msg.sender, rootID, totalSupply, '');
    }

    // decimals reprents the divisibility depth of 1 amount in float notation
    uint256 public decimals;
    string public name;
    uint256 public totalSupply;

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, PausableCargo) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createChild(uint256 amount) external override(ParentableCargo) {
        uint256 id = generateId();
        _parents[id] = childPID; // 1

        // there is no difference burn or mint first
        // tho, the helper function
        // `test/helpers/getAssetId.helper.ts`
        // returns id of new asset from last 'TransferSingle` event
        // because both `_burn` and `_mint` emit that event,
        // if `_burn` is called last, helper function will return
        // pid insted of id
        // helper function marked with todo
        // this comment shoukld be removed in helpers fun is fixed
        _burn(msg.sender, childPID, amount);
        _mint(msg.sender, id, amount, '');
        emit NewParent(id, childPID, amount);
    }

    function createGrantChild(uint256 amount) external override(ParentableCargo) {
        uint256 id = generateId();
        _parents[id] = grantChildPid; // 2
        _burn(msg.sender, grantChildPid, amount);
        _mint(msg.sender, id, amount, '');
        emit NewParent(id, grantChildPid, amount);
    }

    function send(
        address to,
        uint256 id,
        uint256 amount
    ) public {
        safeTransferFrom(msg.sender, to, id, amount, '');
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
