// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';

import '../utils/GeneratorID.sol';

// [BREAKS CODE]: invariant forall(uint256 assetID in _creators) _creators[assetID] != address(0);

contract SpaceibleAsset is ERC1155URIStorage, GeneratorID {
    event Royalties(uint256 indexed id, uint256 indexed royalties);

    mapping(uint256 => uint256) private _royalties;
    /// #if_updated forall(uint256 assetID in _creators) _creators[assetID] != address(0);
    mapping(uint256 => address) private _creators;

    constructor(string memory uri) ERC1155(uri) {
        _setBaseURI(uri);
    }

    /// #if_succeeds  {:msg "correct mint params"}
    ///         balance != 0 
    ///     &&  bytes(cid).length != 0
    ///     &&  royalties <= 10000;
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
        _setCreator(id, msg.sender);
    }

    /// #if_succeeds {:msg "royalties only set once"} old(_royalties[id]) == 0;
    function _setRoyalties(uint256 id, uint256 royalties) internal {
        _royalties[id] = royalties;
        emit Royalties(id, royalties);
    }

    function getRoyalties(uint256 id) public returns (uint256) {
        return _royalties[id];
    }

    /// #if_succeeds {:msg "creator only set once"} 
    ///     old(_creators[id]) == address(0) &&
    ///     creator != address(0);
    function _setCreator(uint256 id, address creator) internal {
        _creators[id] = creator;
    }

    function getCreator(uint256 id) public returns (address) {
        return _creators[id];
    }
}
