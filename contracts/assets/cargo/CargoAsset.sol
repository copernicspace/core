// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';

import './PausableCargo.sol';
import './ParentableCargo.sol';
import '../../utils/GeneratorID.sol';
import 'hardhat/console.sol';

contract CargoAsset is ERC1155, PausableCargo, ParentableCargo, Initializable, GeneratorID {
    constructor(string memory uri) ERC1155(uri) {}

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
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function createChild(
        uint256 amount,
        uint256 pid,
        string memory name,
        address to
    ) external override(ParentableCargo) onlyCreator {
        uint256 id = generateId();
        // there is no difference burn or mint first
        // tho, the helper function
        // `test/helpers/getAssetId.helper.ts`
        // returns id of new asset from last 'TransferSingle` event
        // because both `_burn` and `_mint` emit that event,
        // if `_burn` is called last, helper function will return
        // pid insted of id
        // helper function marked with todo
        // this comment shoukld be removed when helper function is fixed
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
