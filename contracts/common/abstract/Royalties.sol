// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

abstract contract Royalties {
    uint256 public royalties;

    function _setRoyalties(uint256 _royalties) internal {
            royalties = _royalties;
    }

}
