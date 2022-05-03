// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

abstract contract Decimals {
    uint256 public decimals;

    function setDecimals(uint256 _decimals) internal {
        decimals = _decimals;
    }
}
