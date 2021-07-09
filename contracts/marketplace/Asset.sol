// SPDX-License-Identifier: private
pragma solidity =0.8.4;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import './interfaces/Parentable.sol';
import './interfaces/Licenseble.sol';
import './interfaces/Divisible.sol';

contract Asset is ERC1155, Parentable, Licencable, Divisible {
	constructor(string memory uri) ERC1155(uri) {}

	//  input value for new assets id generation
	uint256 private nonce;

	function generateNewId() internal returns (uint256) {
		return ++nonce;
	}

	/**
    This  method creates root asset
    */
	function createRoot(
		bool _isPublic,
		bool _isDivisible,
		uint256 _weight
	) public {
		// step 1: generate id of new asset
		uint256 id = generateNewId();
		// step 2: mint new token
		_mint(msg.sender, id, 1, '');
		// step 3: set derivation rules
		if (_isPublic) {
			makePublic(id);
		} else {
			makePrivate(id);
		}
		// step 4: set divisibility rules
		if (_isDivisible) {
			makeDivisible(id);
		} else {
			makeNotDivisible(id);
		}
		// step 5: set weight
		if (_weight != 0) {
			setWeight(id, _weight);
		}
	}

	/**
    This method creates child asset
    */
	function create(
		uint256 _pid,
		bool _isPublic,
		bool _isDivisible,
		uint256 _weight
	) public parentAllowed(_pid) {
		// step 1: get id of new asset from nonce
		uint256 id = generateNewId();
		// step 2: mint new token
		_mint(msg.sender, id, 1, '');
		// step 3: set parent id
		setParent(id, _pid);
		// step 4: set parent derivation access
		if (_isPublic) {
			makePublic(id);
		} else {
			makePrivate(id);
		}
		// step 5: set divisibility rules
		if (_isDivisible) {
			makeDivisible(id);
		} else {
			makeNotDivisible(id);
		}
		// step 5: set weight
		setWeight(id, _weight);
	}

	function send(address _to, uint256 _id) public {
		safeTransferFrom(msg.sender, _to, _id, 1, '');
	}

	function sendFrom(
		address _from,
		address _to,
		uint256 _id
	) public {
		safeTransferFrom(_from, _to, _id, 1, '');
	}

	// ========= PARENTABLE

	/*
    mapping to store list of addresses for each asset
    which can use asset as parent

    if asset id has zero address -> true -- asset is public,
    meaning that any can use it as parent

    else user can set allowed addresses during creation of asset
    note: user can add it's own address to disallow anyone
    use asset as parent
    */
	mapping(uint256 => mapping(address => bool)) private derivationRules;

	// map of asset's parent
	mapping(uint256 => uint256) private parentIds;

	function makePublic(uint256 _id) public override onlyAssetOwner(_id) {
		derivationRules[_id][address(0)] = true;
	}

	function makePrivate(uint256 _id) public override onlyAssetOwner(_id) {
		derivationRules[_id][address(0)] = false;
	}

	function allow(address _address, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		derivationRules[_id][_address] = true;
	}

	function allowBatch(address[] memory _addresses, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		for (uint256 i = 0; i < _addresses.length; i++) {
			allow(_addresses[i], _id);
		}
	}

	function disallow(address _address, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		derivationRules[_id][_address] = false;
	}

	function disallowBatch(address[] memory _addresses, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		for (uint256 i = 0; i < _addresses.length; i++) {
			disallow(_addresses[i], _id);
		}
	}

	function setParent(uint256 id, uint256 pid) internal {
		parentIds[id] = pid;
	}

	function getParentID(uint256 _id) public view override returns (uint256) {
		return parentIds[_id];
	}

	/**
        modifier to determine whether msg.sender is allowed
        to use asset as parent
        @param _pid - parent id
     */
	modifier parentAllowed(uint256 _pid) {
		require(
			isPublic(_pid) || isAllowed(_pid, msg.sender),
			'Can not create new asset, based on selected as parent'
		);
		_;
	}

	modifier onlyAssetOwner(uint256 _id) {
		require(balanceOf(msg.sender, _id) > 0, 'Not owner');
		_;
	}

	function isPublic(uint256 id) public view override returns (bool) {
		return derivationRules[id][address(0)] == true;
	}

	function isAllowed(uint256 id, address requester)
		public
		view
		override
		returns (bool)
	{
		return derivationRules[id][requester] == true;
	}

	//================= Licensable

	// mapping to store expiration date of each licence
	mapping(uint256 => uint256) expirationDates;

	function generateNewLicenceId() internal returns (uint256) {
		return ++nonce | LICENCE_BIT;
	}

	function createLicence(
		uint256 _pid,
		address _to,
		uint256 _expirationDate
	) public override parentAllowed(_pid) returns (uint256) {
		// step 1: get id of new asset from nonce
		uint256 id = generateNewLicenceId();
		// step 2: mint new token
		_mint(_to, id, 1, '');
		// step 3: set parent id
		setParent(id, _pid);
		// step 4: set expiration date
		setExpiration(id, _expirationDate);

		return id;
	}

	// The top bit is a flag to tell if this is a licence
	uint256 constant LICENCE_BIT = 1 << 255;

	function isLicence(uint256 _id) public pure override returns (bool) {
		return _id & LICENCE_BIT == LICENCE_BIT;
	}

	function setExpiration(uint256 _id, uint256 expirationDate) internal {
		// pass expirationDate zero to set lifetime licence
		expirationDates[_id] = expirationDate;
	}

	function getExpiration(uint256 _id)
		external
		view
		override
		returns (uint256)
	{
		return expirationDates[_id];
	}

	function licenceOf(uint256 _id) public view override returns (uint256) {
		if (isLicence(_id)) {
			return getParentID(_id);
		} else {
			return 0;
		}
	}

	//================= Divisible
	mapping(uint256 => bool) private divisibilityRules;
	mapping(uint256 => uint256) private divisionParentIDs;
	mapping(uint256 => uint256) private weightMap;
	mapping(uint256 => uint256) private minStepSizeMap;

	// Minimal Step Size defaults to zero
	// if Minimal Step Size == 0 then all step sizes are allowed

	function makeDivisible(uint256 _id) public override onlyAssetOwner(_id) {
		divisibilityRules[_id] = true;
	}

	function makeNotDivisible(uint256 _id) public override onlyAssetOwner(_id) {
		divisibilityRules[_id] = false;
	}

	function isDivisible(uint256 _id)
		public
		view
		override
		returns (bool _isDivisible)
	{
		return divisibilityRules[_id];
	}

	function getWeight(uint256 _id)
		public
		view
		override
		returns (uint256 weight)
	{
		return weightMap[_id];
	}

	function setWeight(uint256 _id, uint256 _weight)
		public
		override
		onlyAssetOwner(_id)
	{
		weightMap[_id] = _weight;
	}

	function getMinStepSize(uint256 _id)
		public
		view
		override
		returns (uint256 minStepSize) 
	{
		return minStepSizeMap[_id];
	}

	function setMinStepSize(uint256 _id, uint256 _stepSize)
		public
		override
		onlyAssetOwner(_id)
	{
		minStepSizeMap[_id] = _stepSize;
	}

	function divisionOf(uint256 _id)
		public
		view
		override
		returns (uint256 divID)
	{
		return divisionParentIDs[_id];
	}

	event Divide(uint256[] listOfIDs);

	function stepDivideInto(
		uint256 _id,
		uint256 _stepNum,
		uint256 _stepSize
	) public override onlyAssetOwner(_id) returns (uint256[] memory mintedIDs) {
		// require that step size * step num is <= asset's weight
		require(
			_stepSize * _stepNum <= weightMap[_id],
			'Required weight exceeds asset weight'
		);
		// require that asset is allowed to be divisible
		require(
			divisibilityRules[_id] == true,
			'Asset has divisibility disabled'
		);
		// require that step size is >= minimal step size
		require(
			minStepSizeMap[_id] == 0 || _stepSize >= minStepSizeMap[_id],
			'Required step size is less than set minimal step size'
		);
		// require that step num is positive (non-zero)
		require(
			_stepNum > 0,
			'Step number must be positive (non-zero)'
		);
		require(
			_stepSize > 0,
			'Step size must be positive (non-zero)'
		);

		uint256[] memory _ids = new uint256[](_stepNum);
		uint256[] memory _sizes = new uint256[](_stepNum);

		// step 1: generate and save ids for new assets
		for (uint256 i = 0; i < _stepNum; i++) {
			_ids[i] = generateNewId();
		}
		// step 2: create a size array for _mintBatch
		for (uint256 i = 0; i < _stepNum; i++) {
			_sizes[i] = 1;
		}
		// step 3: batch mint new tokens
		_mintBatch(msg.sender, _ids, _sizes, '');
		// step 4: set tokens' division parent IDs
		for (uint256 i = 0; i < _stepNum; i++) {
			divisionParentIDs[_ids[i]] = _id;
		}
		// step 4: set the correct weight for the minted tokens
		for (uint256 i = 0; i < _stepNum; i++) {
			weightMap[_ids[i]] = _stepSize;
		}
		// step 5: remove the weight from original asset
		weightMap[_id] -= _stepSize * _stepNum;

		// step 6: correctly map created tokens to their parent
		for (uint256 i = 0; i < _stepNum; i++) {
			parentIds[_ids[i]] = _id;
		}

		// emit an event with values
		emit Divide(_ids);

		// return ids of minted tokens
		return _ids;
	}
	/*
		BatchDivideInto(...):

		Works by passing in two arrays, one representing desired weights into which
		the asset will be divided, and one representing the number of to-be-created assets
		that will have said specified weight

		numSizes = [5, 17, 3]
		stepSizes = [100, 200, 300]
		
		divides into:
		5 assets with weight 100
		17 assets with weight 200
		3 assets with weight 300
		etc.
	*/

	function batchDivideInto(
		uint256 _id,
		uint256[] memory listOfNumSizes,
		uint256[] memory listOfStepSizes
	) public override onlyAssetOwner(_id) returns (uint256[] memory mintedIDs) {
		// check that arrays have equal length
		require(listOfNumSizes.length == listOfStepSizes.length, 'Arrays must be of equal size');
		// check that arrays have equal size and are not empty
		require(listOfNumSizes.length != 0 && listOfStepSizes.length != 0, 'Arrays must not be empty');
		// require that step size[] * step num[] is <= asset's weight
		uint256 totalRemovedWeight = 0;
		for(uint256 i = 0; i < listOfNumSizes.length; i++) {
			totalRemovedWeight += listOfNumSizes[i] * listOfStepSizes[i];
		}
		require(
			totalRemovedWeight <= weightMap[_id],
			'Required weight exceeds asset weight'
		);
		// require that asset is allowed to be divisible
		require(
			divisibilityRules[_id] == true,
			'Asset has divisibility disabled'
		);
		// require that step size is >= minimal step size
		for(uint256 i = 0; i < listOfNumSizes.length; i++) {
			require(
				minStepSizeMap[_id] == 0 || listOfStepSizes[i] >= minStepSizeMap[_id],
				'Required step size is less than set minimal step size'
			);
		}
		// require that step num is positive (non-zero)
		for(uint256 i = 0; i < listOfNumSizes.length; i++) {
			require(
				listOfNumSizes[i] > 0,
				'Step number must be positive (non-zero)'
			);
		}
		// require that step size is positive (non-zero)
		for(uint256 i = 0; i < listOfNumSizes.length; i++) {
			require(
				listOfStepSizes[i] > 0,
				'Step size must be positive (non-zero)'
			);
		}
		// calculate total divisions num
		uint256 totalDivNum = 0;
		for(uint256 i = 0; i < listOfNumSizes.length; i++) {
			totalDivNum += listOfNumSizes[i];
		}
		
		uint256[] memory _ids = new uint256[](totalDivNum);

		// step 1: generate and save ids for new assets
		for (uint256 i = 0; i < totalDivNum; i++) {
			_ids[i] = generateNewId();
		}
		uint256 idIncrement = 0;
		// step 2: batch mint new tokens
		// for each of the num sizes:
		for(uint256 i = 0; i < listOfNumSizes.length; i++) {
			// fill a loop with size 1 to use mintBatch
			uint256[] memory _sizes = new uint256[](listOfNumSizes[i]);
			uint256[] memory _pickedIDs = new uint256[](listOfNumSizes[i]);		// can lower it to listOfNumSizes[i]
			for (uint256 j = 0; j < listOfNumSizes[i]; j++) {
				_sizes[j] = 1;
			}
			// create a list of new IDs for specified num/step size
			for (uint256 l = 0; l < listOfNumSizes[i]; l++) {
				_pickedIDs[l] = _ids[idIncrement + l];
			}
			// mint tokens
			_mintBatch(msg.sender, _pickedIDs, _sizes, '');
			// set correct weights
			for (uint256 m = 0; m < listOfNumSizes[i]; m++) {
				weightMap[_pickedIDs[m]] = listOfStepSizes[i];
			}
			// increment ID helper
			idIncrement += listOfNumSizes[i];
			
		}

		//step 4: set tokens' division parent IDs
		for (uint256 i = 0; i < totalDivNum; i++) {
			divisionParentIDs[_ids[i]] = _id;
		}
		// step 5: remove the weight from original asset
		weightMap[_id] -= totalRemovedWeight;

		// step 6: correctly map created tokens to their parent
		for (uint256 i = 0; i < totalDivNum; i++) {
			parentIds[_ids[i]] = _id;
		}

		// emit an event with values
		emit Divide(_ids);

		// return ids of minted tokens
		return _ids;
	}
}
