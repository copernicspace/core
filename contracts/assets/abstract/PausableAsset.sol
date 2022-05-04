// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

import './Creator.sol';

abstract contract PausableAsset is ERC1155, Pausable, Creator {
    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     *
     * Requirements:
     * `operator` is owner
     * OR
     * `from` is owner
     * OR
     * asset is not paused
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        require(operator == creator || from == creator || !paused(), 'Pausable: asset is locked');
    }

    function _setPause(bool isPause) internal {
        if (isPause) {
            _pause();
        }
    }

    function pause() public onlyCreator {
        _pause();
    }

    function unpause() public onlyCreator {
        _unpause();
    }
}
