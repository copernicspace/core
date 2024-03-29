// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

interface IParentableWithName {
    event NewParent(uint256 indexed id, uint256 indexed pid, uint256 indexed amount);

    function createChild(
        uint256 amount,
        uint256 childAmount,
        uint256 pid,
        string memory name,
        address to,
        string memory cid,
        uint256 sroyalties
    ) external;

    function getParent(uint256 id) external view returns (uint256 pid);

    function getName(uint256 id) external view returns (string memory);

    function getFullName(uint256 id) external view returns (string memory);
}
