// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import '../utils/GeneratorID.sol';

// [BREAKS CODE]: invariant forall(uint256 assetID in _creators) _creators[assetID] != address(0);
contract SpaceibleAsset is ERC1155URIStorage, GeneratorID, AccessControl, Ownable {
    event Royalties(uint256 indexed id, uint256 indexed royalties);
    event PermanentURI(string _value, uint256 indexed _id);

    mapping(uint256 => uint256) private _royalties;
    /// #if_updated forall(uint256 assetID in _creators) _creators[assetID] != address(0);
    mapping(uint256 => address) private _creators;

    bool public openCreate = false;
    bytes32 public constant CREATOR_ROLE = keccak256('CREATOR_ROLE');
    string private metadataCID;

    constructor(string memory uri) ERC1155(uri) {
        _setBaseURI(uri);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function contractURI() public view returns (string memory) {
        return metadataCID;
    }

    function setMetadataCID(string memory _metadataCID) public onlyAdmin {
        metadataCID = _metadataCID;
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
        bool senderHasCreatorRole = hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(CREATOR_ROLE, msg.sender);
        require(openCreate || senderHasCreatorRole, 'You are not allowed to create new Spaceible Asset');
        uint256 id = generateId();
        _mint(msg.sender, id, balance, data);
        _setURI(id, cid);
        _setRoyalties(id, royalties);
        _setCreator(id, msg.sender);
        emit PermanentURI(cid, id);
    }

    /// #if_succeeds {:msg "royalties only set once"} old(_royalties[id]) == 0;
    function _setRoyalties(uint256 id, uint256 royalties) internal {
        _royalties[id] = royalties;
        emit Royalties(id, royalties);
    }

    function getRoyalties(uint256 id) public view returns (uint256) {
        return _royalties[id];
    }

    /// #if_succeeds {:msg "creator only set once"}
    ///     old(_creators[id]) == address(0) &&
    ///     creator != address(0);
    function _setCreator(uint256 id, address creator) internal {
        _creators[id] = creator;
    }

    function getCreator(uint256 id) public view returns (address) {
        return _creators[id];
    }

    function grantCreatorRole(address target) external onlyAdmin {
        grantRole(CREATOR_ROLE, target);
    }

    function revokeCreatorRole(address target) external onlyAdmin {
        revokeRole(CREATOR_ROLE, target);
    }

    function hasCreatorRole(address target) public view returns (bool) {
        return openCreate || hasRole(CREATOR_ROLE, target) || hasRole(DEFAULT_ADMIN_ROLE, target);
    }

    function toggleOpenCreate() external onlyAdmin {
        openCreate = !openCreate;
    }

    function burn(uint256 id, uint256 amount) external {
        _burn(msg.sender, id, amount);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 'Only admin can perform this action');
        _;
    }
}
