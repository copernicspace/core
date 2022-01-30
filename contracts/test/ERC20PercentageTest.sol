import '../utils/ERC20Percentage.sol';

contract ERC20PercentageTest {
    using ERC20Percentage for uint256;

    function testTake(uint256 from, uint256 percentage, uint256 decimals) public pure returns (uint256) {
        return from.take(percentage, decimals);
    }
}
