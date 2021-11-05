// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import './PausableCargo.sol';
import './ParentableCargo.sol';
import '../../utils/GeneratorID.sol';
import 'hardhat/console.sol';

contract CargoAsset is ERC1155, PausableCargo, ParentableCargo, GeneratorID {
    constructor(string memory uri) ERC1155(uri) {}

    // nonce value is used for generation of ids
    uint256 private nonce;
    // decimals reprents the divisibility depth of 1 amount in float notation
    uint256 public constant decimals = 18;

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

    function create(uint256 amount) external {
        uint256 id = generateId();
        creators[id] = _msgSender();
        _mint(_msgSender(), id, amount, '');
    }

    function createChild(uint256 pid, uint256 amount)
        external
        override(ParentableCargo)
    {
        uint256 id = generateId();
        _parents[id] = pid;

        // there is no difference burn or mint first
        // tho, the helper function
        // `test/helpers/getAssetId.helper.ts`
        // returns id of new asset from last 'TransferSingle` event
        // because both `_burn` and `_mint` emit that event,
        // if `_burn` is called last, helper function will return
        // pid insted of id
        // helper function marked with todo
        // this comment shoukld be removed in helpers fun is fixed
        _burn(msg.sender, pid, amount);
        _mint(msg.sender, id, amount, '');
        emit NewParent(id, pid);
    }

    function send(
        address to,
        uint256 id,
        uint256 amount
    ) public {
        console.log(msg.sender);
        console.log(_msgSender());
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
