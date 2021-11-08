// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

interface Parentable {
    event NewParent(uint256 indexed id, uint256 indexed pid);

    function createChild(uint256 pid, uint256 amount) external;

    function getParent(uint256 id) external returns (uint256);
}
