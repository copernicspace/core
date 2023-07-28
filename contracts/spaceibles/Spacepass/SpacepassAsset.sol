// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import '../../utils/GeneratorID.sol';
import '../../common/abstract/KYC.sol';

contract SpacepassAsset is ERC1155URIStorage, GeneratorID, AccessControl, Ownable, KYC {
    event Royalties(uint256 indexed id, uint256 indexed royalties);
    
    string public name;
    string public symbol;

    mapping(uint256 => uint256) private _royalties;
    mapping(uint256 => address) private _creators;

    bool public openCreate = false;
    bool public openSale = false;

    bytes32 public constant CREATOR_ROLE = keccak256('CREATOR_ROLE');
    string private metadataCID;

    constructor(string memory uri, address kycAddress) ERC1155(uri) {
        name = 'Copernic Space Passports';
        symbol = 'CSP';
        _setBaseURI(uri);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        setupKyc(kycAddress);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function contractURI() public view returns (string memory) {
        return metadataCID;
    }

    function setContractURI(string memory _contractURI) public onlyAdmin {
        metadataCID = _contractURI;
    }

    function mint(string memory cid, uint256 balance, uint256 royalties, bytes memory data) public {
        bool senderHasCreatorRole = hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(CREATOR_ROLE, msg.sender);
        require(openCreate || senderHasCreatorRole, 'You are not allowed to create new Spaceible Asset');
        uint256 id = generateId();
        _mint(msg.sender, id, balance, data);
        _setURI(id, cid);
        _setRoyalties(id, royalties);
        _setCreator(id, msg.sender);
    }

    function setURI(uint256 id, string memory cid) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(CREATOR_ROLE, msg.sender), 'You are not allowed to set URI');
        _setURI(id, cid);
    }

    function _setRoyalties(uint256 id, uint256 royalties) internal {
        _royalties[id] = royalties;
        emit Royalties(id, royalties);
    }

    function getRoyalties(uint256 id) public view returns (uint256) {
        return _royalties[id];
    }

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

    function toggleOpenSale() external onlyAdmin {
        openSale = !openSale;
    }

    function burn(uint256 id, uint256 amount) external {
        _burn(msg.sender, id, amount);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 'Only admin can perform this action');
        _;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155) {
        // if not open sale - check for sender/receiver to be on WL (KYC register)
        if (!openSale) {
            if (from != address(0)) {
                require(kycRegister.getKycStatusInfo(from), 'from adress is not on WL');
            }
            if (to != address(0)) {
                require(kycRegister.getKycStatusInfo(to), 'to address is not on WL');
            }
        }

        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
