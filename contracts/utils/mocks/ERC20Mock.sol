// SPDX-License-Identifier: private
pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// has default precision value = 18
contract ERC20Mock is ERC20 {
    constructor() ERC20('MockToken', 'MT') {}

    function mint(uint256 amount) public {
        mintTo(msg.sender, amount);
    }

    function mintTo(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
