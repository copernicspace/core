// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

interface ClonableCargo {
    // instead off constructor for CloneFactory
    function initialize(
        string memory _uri,
        string memory _name,
        uint256 _amount,
        uint256 _totalSupply
    ) external;
}
