// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

abstract contract Royalties {
    uint256 public royalties;

    function _setRoyalties(uint256 _royalties) internal {
        royalties = _royalties;
    }

    mapping(address => uint256) public secondaryRoyalties;

    function _setSRoyalties(address beneficiary, uint256 royalties) internal {
        secondaryRoyalties[beneficiary] = royalties;
    }
}
