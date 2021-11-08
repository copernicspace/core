// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

interface Pausable {
    event Paused(address indexed operator, uint256 indexed id);
    event Unpaused(address indexed operator, uint256 indexed id);

    function pause(uint256 id) external;

    function unpause(uint256 id) external;
}
