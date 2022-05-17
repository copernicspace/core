// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

abstract contract Royalties {
    uint256 internal _royalties;

    function _setRoyalties(uint256 royalties) internal {
        if (royalties > 0) {
            _royalties = royalties;
        }
    }

    function royalties() public view returns (uint256) {
        return _royalties;
    }
}
