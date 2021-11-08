// SPDX-License-Identifier: private
pragma solidity ^0.8.9;
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

library ERC20Percentage {
    using SafeMath for uint256;
    uint256 public constant baseDecimal = 1e20;

    function take(
        uint256 percentage,
        uint256 amount,
        uint256 decimals
    ) internal pure returns (uint256 result) {
        uint256 normalized = percentage.mul(10**decimals).div(baseDecimal);
        result = amount.mul(normalized).div(10**decimals);
    }
}
