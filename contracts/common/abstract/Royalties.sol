// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

abstract contract Royalties {
    event RootRoyalties(uint256 indexed id, uint256 indexed royalties);
    event SecondaryRoyalties(uint256 indexed id, address indexed to, uint256 indexed royalties);

    struct SRoyalties {
        address to;
        uint256 value;
    }

    uint256 public rootRoyalties;
    mapping(uint256 => SRoyalties) public secondaryRoyalties;

    function _setRootRoyalties(uint256 value) internal {
        rootRoyalties = value;
        emit RootRoyalties(0, value);
    }

    function _setSecondaryRoyalties(
        uint256 id,
        address to,
        uint256 value
    ) internal {
        SRoyalties storage sroyalties = secondaryRoyalties[id];
        sroyalties.to = to;
        sroyalties.value = value;
        emit SecondaryRoyalties(id, to, value);
    }
}
