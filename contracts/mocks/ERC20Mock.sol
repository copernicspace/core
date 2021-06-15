// SPDX-License-Identifier: private
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// has default precision value = 18
contract ERC20Mock is ERC20 {
	constructor() ERC20('MockToken', 'MT') {
		_mint(msg.sender, 1000000000000000000000);
	}

	function mint() public {
		_mint(msg.sender, 1000000000000000000000);
	}
}
