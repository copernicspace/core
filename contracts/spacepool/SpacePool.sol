// SPDX-License-Identifier: private
pragma solidity =0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../mocks/ERC20Mock.sol';

contract SpacePool {
	// address of the ERC20 token to serve as liquidity value on the space pool
	address private liquidityToken;
	// address of proof of liquidity token
	address private polToken;

	// LPs shares
	mapping(address => uint256) private liquidity;

	event addedLiquidity(address indexed liquidityProvider, uint256 amount);

	constructor(address _liquidityToken, address _polToken) {
		liquidityToken = _liquidityToken;
		polToken = _polToken;
	}

	/**
	 * user can add liquidity to the pool and get PoL token in return;
	 * @dev user has to approve token in advance
	 */
	function addLiquidity(uint256 amount) external {
		//step 0: transfer token to the contract from user
		IERC20(liquidityToken).transferFrom(msg.sender, address(this), amount);

		// step 1: add LP share
		liquidity[msg.sender] += amount;

		// step 2: mint PoL token back to user, 1:1 ratio
		ERC20Mock(polToken).mintTo(msg.sender, amount);

		// step 3: emit event
		emit addedLiquidity(msg.sender, amount);
	}

	function getMyLiquidity() external view returns (uint256) {
		return liquidity[msg.sender];
	}
}
