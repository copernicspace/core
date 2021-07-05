// SPDX-License-Identifier: private
pragma solidity =0.8.4;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract SpacePool is AccessControl, ERC1155 {
	struct LPPosition {
		uint256 timestamp;
		uint256 amount;
		uint256 poolEpoch;
	}

	bytes32 public constant LIQUIDITY_OPERATOR =
		keccak256('LIQUIDITY_OPERATOR');
	// address of the ERC20 token to serve as liquidity value on the space pool
	address private liquidityToken;

	// space pool epoch nonce
	uint256 public speNonce;

	// The top bit is a flag to tell if this is a LP NFT
	uint256 constant LP_NFT_BIT = 1 << 255;

	function isLpnft(uint256 _id) public pure returns (bool) {
		return _id & LP_NFT_BIT == LP_NFT_BIT;
	}

	// liquidity provider nonce
	uint256 public lpnftNonce;

	// LPs shares [epoch id => [lp => balance]]
	mapping(uint256 => mapping(address => uint256)) private liquidity;

	// LP NFT
	mapping(address => LPPosition[]) positions;
	// return of investment rate
	uint256 private roiRate;

	event AddedLiquidity(
		address indexed liquidityProvider,
		uint256 amount,
		uint256 lpNftId
	);
	event ExtractLiquidity(
		uint256 indexed epoch,
		address indexed to,
		uint256 indexed amount
	);
	event NewRoIRate(uint256 indexed newRoI, address indexed operator);
	event Claim(address indexed liquidityProvider, uint256 indexed amount);

	constructor(address _liquidityToken) ERC1155('') {
		liquidityToken = _liquidityToken;
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	function supportsInterface(bytes4 interfaceId)
		public
		view
		virtual
		override(ERC1155, AccessControl)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
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
		liquidity[speNonce][msg.sender] += amount;

		// step 2: generate LP NFT id
		uint256 lpnftId = ++lpnftNonce | LP_NFT_BIT;

		// step 3: mint LP NFT token back to user
		_mint(msg.sender, lpnftId, 1, '');

		// step 4: set nft metadata
		positions[msg.sender].push(
			LPPosition({
				timestamp: block.timestamp,
				amount: amount,
				poolEpoch: speNonce
			})
		);

		// step 5: emit event
		emit AddedLiquidity(msg.sender, amount, lpnftId);
	}

	function getMyPositions() public view returns (LPPosition[] memory) {
		return positions[msg.sender];
	}

	function getMyLiquidity() external view returns (uint256) {
		return liquidity[speNonce][msg.sender];
	}

	function extractLiquidity(address to, uint256 amount) external {
		// step 0: verify msg.sender has access to liquidity
		require(
			hasRole(LIQUIDITY_OPERATOR, msg.sender),
			'Caller is not a liquidity operator'
		);

		// step 1: verify amount is <= pool's amount
		require(
			IERC20(liquidityToken).balanceOf(address(this)) >= amount,
			'There is not enough liquidity'
		);

		// step 2: extract liquidity
		IERC20(liquidityToken).transfer(to, amount);

		// step 3: emit event
		emit ExtractLiquidity(speNonce, to, amount);

		// step 4: increment nonce, setting next space pool epoch ID
		speNonce++;
	}

	function setRoIRate(uint256 _roiRate) external {
		require(
			hasRole(LIQUIDITY_OPERATOR, msg.sender),
			'Caller can not set RoI rate'
		);

		roiRate = _roiRate;
		emit NewRoIRate(roiRate, msg.sender);
	}
}
