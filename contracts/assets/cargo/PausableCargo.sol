// SPDX-License-Identifier: private
pragma solidity ^0.8.9;
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '../interfaces/Pausable.sol';

abstract contract PausableCargo is ERC1155, Pausable {
    mapping(uint256 => bool) private paused;
    mapping(uint256 => address) internal creators;

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the id of transferred asset must not be paused.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        for (uint256 i = 0; i < ids.length; i++) {
            require(!paused[ids[i]], 'Pausable: token is paused');
        }
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function pause(uint256 id) external override(Pausable) {
        require(_msgSender() == creators[id], 'Pausable: only asset creator can pause');
        paused[id] = true;
    }

    function unpause(uint256 id) external override(Pausable) {
        require(_msgSender() == creators[id], 'Pausable: only asset creator can unpause');
        paused[id] = false;
    }
}
