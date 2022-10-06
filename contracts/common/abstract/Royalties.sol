// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

abstract contract Royalties {
    event RootRoyalties(uint256 indexed id, uint256 indexed royalties);
    event SecondaryRoyalties(uint256 indexed id, address indexed to, uint256 indexed royalties);

    uint256 public royalties;
    mapping(uint256 => mapping(address => uint256)) public secondaryRoyalties;

    function _setRoyalties(uint256 _royalties) internal {
        royalties = _royalties;
        emit RootRoyalties(0, _royalties);
    }

    function _setSRoyalties(
        uint256 id,
        address to,
        uint256 sroyalties
    ) internal {
        secondaryRoyalties[id][to] = sroyalties;
        emit SecondaryRoyalties(id, to, sroyalties);
    }
}
