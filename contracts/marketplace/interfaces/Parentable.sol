// SPDX-License-Identifier: private
pragma solidity ^0.8.4;

interface Parentable {
	function makePublic(uint256 _id) external;

	function makePrivate(uint256 _id) external;

	function allow(address _address, uint256 _id) external;

	function allowBatch(address[] memory _addresses, uint256 _id) external;

	function disallow(address _address, uint256 _id) external;

	function disallowBatch(address[] memory _addresses, uint256 _id) external;

	function getParentID(uint256 _id) external view returns (uint256);

	function isPublic(uint256 id) external view returns (bool);

	function isAllowed(uint256 id, address requester)
		external
		view
		returns (bool);
}
