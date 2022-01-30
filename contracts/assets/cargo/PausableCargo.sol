// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

import '../interfaces/Pausable.sol';

abstract contract PausableCargo is ERC1155, Pausable {
    bool public paused;
    address public creator;

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     *
     * Requirements:
     * - the asset must not be paused.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        require(!paused, 'Pausable: token is paused');
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function pause() external override(Pausable) onlyCreator {
        paused = true;
    }

    function unpause() external override(Pausable) onlyCreator {
        paused = false;
    }

    modifier onlyCreator() {
        require(_msgSender() == creator, 'unauthorized -- only for creator');
        _;
    }
}
