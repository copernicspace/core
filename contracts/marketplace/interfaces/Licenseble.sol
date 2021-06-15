// SPDX-License-Identifier: private
pragma solidity 0.8.4;

interface Licencable {
	function createLicence(
		uint256 pid,
		address to,
		uint256 expirationDate
	) external returns (uint256);

	function isLicence(uint256 _id) external view returns (bool);

	function getExpiration(uint256 _id) external view returns (uint256);

	function licenceOf(uint256 _id) external view returns (uint256);
}
