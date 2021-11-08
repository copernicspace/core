// SPDX-License-Identifier: private
pragma solidity ^0.8.9;
import '../utils/GeneratorID.sol';

contract OffchainSale is GeneratorID {
    event NewSaleOffcahin(
        address indexed seller,
        address indexed buyer,
        string indexed metaHash,
        uint256 what,
        uint256 amount
    );
    
    function sellOffchain(
        uint256 _amount,
        uint256 _what,
        address _to,
        string memory metaHash,
        string memory desc,
        uint256 pid
    ) public {
        uint256 id = generateId();
        
    }
    function sellOffchain(
        uint256 _amount,
        uint256 _what,
        address _to,
        string memory metaHash,
        string memory desc
    ) public {
        uint256 id = generateId();
        
    }
}
