// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

abstract contract Decimals {
    uint256 public decimals;

    function _setDecimals(uint256 _decimals) internal {
        decimals = _decimals;
    }
}
