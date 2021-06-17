// SPDX-License-Identifier: private
pragma solidity =0.8.4;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../mocks/ERC20Mock.sol';

contract SpacePool is AccessControl {
	bytes32 public constant LIQUIDITY_OPERATOR =
		keccak256('LIQUIDITY_OPERATOR');

	// address of the ERC20 token to serve as liquidity value on the space pool
	address private liquidityToken;
	// address of proof of liquidity token
	address private polToken;

	// LPs shares
	mapping(address => uint256) private liquidity;

	event AddedLiquidity(address indexed liquidityProvider, uint256 amount);
	event ExtractLiquidity(
		address indexed from,
		address indexed to,
		uint256 indexed amount
	);

	constructor(address _liquidityToken, address _polToken) {
		liquidityToken = _liquidityToken;
		polToken = _polToken;
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	function addLiquidityOperator(address operator) external {
		require(
			hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
			'Only admin can add liquidity operator'
		);

		grantRole(LIQUIDITY_OPERATOR, operator);
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
		emit AddedLiquidity(msg.sender, amount);
	}

	function getMyLiquidity() external view returns (uint256) {
		return liquidity[msg.sender];
	}

	function extractLiquidity(uint256 amount, address to) external {
		// step 0: verify msg.sender has access to liquidity
		require(
			hasRole(LIQUIDITY_OPERATOR, msg.sender),
			'Caller is not a liquidity operator'
		);

		// step 1: assert liquidity pool has enough value
		require(
			IERC20(liquidityToken).balanceOf(address(this)) >= amount,
			'There is not enough liquidity'
		);

		// step 2: extract liquidity
		IERC20(liquidityToken).transfer(to, amount);

		// step 3: emit event
		emit ExtractLiquidity(msg.sender, to, amount);
	}
}
