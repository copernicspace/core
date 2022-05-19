// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';

import '../utils/GeneratorID.sol';

contract SpaceibleAsset is ERC1155URIStorage, GeneratorID {
    event Royalties(uint256 indexed id, uint256 indexed royalties);

    mapping(uint256 => uint256) private _royalties;

    constructor(string memory uri) ERC1155(uri) {
        _setBaseURI(uri);
    }

    function mint(
        string memory cid,
        uint256 balance,
        uint256 royalties,
        bytes memory data
    ) public {
        uint256 id = generateId();
        _mint(msg.sender, id, balance, data);
        _setURI(id, cid);
        _setRoyalties(id, royalties);
    }

    function _setRoyalties(uint256 id, uint256 royalties) internal {
        _royalties[id] = royalties;
        emit Royalties(id, royalties);
    }
}
