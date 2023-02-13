// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// has default precision value = 18
contract ERC20Mock is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) ERC20(name, symbol) {
        _decimals = decimals;
    }

    function mint(uint256 amount) public {
        mintTo(msg.sender, amount);
    }

    function mintTo(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
