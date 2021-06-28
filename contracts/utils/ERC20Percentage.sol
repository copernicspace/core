import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import 'hardhat/console.sol';

library ERC20Percentage {
	using SafeMath for uint256;
	uint256 public constant baseDecimal = 1e20;

	//	function take(
	//		uint256 percentage,
	//		uint256 from,
	//		uint256 decimals
	//	) internal view returns (uint256 percent) {
	//		uint256 normalized = percentage.mul(10**decimals).div(baseDecimal);
	//		console.log(normalized);
	//		percent = from.mul(normalized).div(10**decimals);
	//		console.log(percent);
	//	}

	function take(
		uint256 percentage,
		uint256 amount,
		uint256 decimals
	) internal view returns (uint256 result) {
		uint256 normalized = percentage.mul(10**decimals).div(baseDecimal);
		result = amount.mul(normalized).div(10**decimals);
	}
}
