// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

abstract contract GeneratorID {
    uint256 private nonce;

    function generateId() internal returns (uint256) {
        return ++nonce;
    }
}
