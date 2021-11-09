import '../utils/ERC20Percentage.sol';

contract ERC20PercentageTest {
    using ERC20Percentage for uint256;

    function take(uint256 percentage, uint256 from) public view returns (uint256) {
        return ERC20Percentage.take(percentage, from, 18);
    }
}
