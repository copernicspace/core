// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

interface Parentable {
    event NewParent(uint256 indexed id, uint256 indexed pid, uint256 indexed amount);

    function createChild(uint256 amount) external;

    function createGrantChild(uint256 amount) external virtual;

    function getParent(uint256 id) external returns (uint256);
}
