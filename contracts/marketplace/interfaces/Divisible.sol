pragma solidity 0.8.4;

interface Divisible {
	function stepDivideInto(
		uint256 _id,
		uint256 _stepNum,
		uint256 _stepSize
	) external returns (uint256[] memory mintedIDs);

	function divisionOf(uint256 _id) external view returns (uint256 divID);

	function makeDivisible(uint256 _id) external;

	function makeNotDivisible(uint256 _id) external;

	function getWeight(uint256 _id) external view returns (uint256 weight);

	function setWeight(uint256 _id, uint256 _weight) external;

	function isDivisible(uint256 _id) external view returns (bool _isDivisible);
}
