/**
 * Test function set:
 * contains most often-used state-chaning & testing functions
 * for CPR platform tests
 *
 * used for better visibility & shortening of CPR tests
 */

import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { getAssetID } from './getAssetId.helper'
import contractNames from '../../constants/contract.names'
import { getCargoAddress } from './cargoAddress'
import contract_names from '../../constants/contract.names'

/**
 *      1.
 *      Cargo asset creation process:
 */

/**
 * @param _factory              address of the factory contract
 * @param _caller               signer to call the transaction
 * @param _uri                  asset uri
 * @param _name                 asset name
 * @param _decimals             contract decimals
 * @param _totalSupply          contract supply (balance of tokens minted)
 * @param _kycRegisterAddress   address of kyc register instance
 * @returns                     > Address of cargo asset <
 */
export async function cargoCreationAddress(
	_factory: CargoFactory,
	_caller: SignerWithAddress,
	_uri: string,
	_name: string,
	_decimals: BigNumberish,
	_totalSupply: BigNumberish,
	_kycRegister: KycRegister
) {
	return await _factory
		.connect(_caller)
		.createCargo(_uri, _name, _decimals, _totalSupply, _kycRegister.address)
		.then(tx => tx.wait())
		.then(txr => getCargoAddress(txr))
}

/**
 * @param _factory              address of the factory contract
 * @param _caller               signer to call the transaction
 * @param _uri                  asset uri
 * @param _name                 asset name
 * @param _decimals             contract decimals
 * @param _totalSupply          contract supply (balance of tokens minted)
 * @param _kycRegisterAddress   address of kyc register instance
 * @returns                     > Instance of cargo asset <
 */
export async function cargoCreation(
	_factory: CargoFactory,
	_caller: SignerWithAddress,
	_uri: string,
	_name: string,
	_decimals: BigNumberish,
	_totalSupply: BigNumberish,
	_kycRegister: KycRegister
) {
	return await ethers
		.getContractAt(
			contractNames.CARGO_ASSET,
			await cargoCreationAddress(_factory, _caller, _uri, _name, _decimals, _totalSupply, _kycRegister)
		)
		.then(contract => contract as CargoAsset)
}

/**
 *      2.
 *      Cargo child creation process:
 */

/**
 *
 * @param _contract     cargo asset contract to create child of
 * @param _caller       signer to call the transaction
 * @param _amount       balance of tokens minted
 * @param _pid          parent asset ID
 * @param _name         child asset name
 * @param _to           signer to receive the balance minted
 * @returns             ID of child asset
 */
export async function childCreation(
	_contract: CargoAsset,
	_caller: SignerWithAddress,
	_amount: BigNumberish,
	_pid: BigNumberish,
	_name: string,
	_to: SignerWithAddress
) {
	return await _contract
		.connect(_caller)
		.createChild(_amount, _pid, _name, _to.address)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))
}

/**
 *      3.
 *      KYC contract instantiation
 */

/**
 * @param _caller   signer to call the transaction
 * @returns         instance of KYC contract
 */
export async function kycInstantiation(_caller: SignerWithAddress) {
	return await ethers
		.getContractFactory(contract_names.KYC_REGISTER)
		.then(factory => factory.connect(_caller).deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as KycRegister)
}

/**
 *      4.
 *      KYC manipulation
 */

/**
 * @param _kycInstance  KYC contract
 * @param _caller       signer that calls the transaction
 * @param _target       signer whose KYC status is to be set to TRUE
 * @returns             function call
 */
export async function kyc_add(_kycInstance: KycRegister, _caller: SignerWithAddress, _target: SignerWithAddress) {
	return await _kycInstance.connect(_caller).setKycStatus(_target.address, true)
}

/**
 * @param _kycInstance  KYC contract
 * @param _caller       signer that calls the transaction
 * @param _target       signer whose KYC status is to be set to FALSE
 * @returns             function call
 */
export async function kyc_remove(_kycInstance: KycRegister, _caller: SignerWithAddress, _target: SignerWithAddress) {
	return await _kycInstance.connect(_caller).setKycStatus(_target.address, false)
}

/**
 *      5.
 *      Shorthand-testing
 *
 *      used for: most often called tests with chai's expect
 */

/**
 * @param _cargoContract    cargo asset contract on which balances are stored
 * @param _target           signer whose balance is checked
 * @param _targetID         ID of asset whose balance is checked
 * @param _expValue         expected value
 * @returns                 expect statement
 */
export async function checkBal(
	_cargoContract: CargoAsset,
	_target: SignerWithAddress,
	_targetID: BigNumber,
	_expValue: BigNumber
) {
	const actual = await _cargoContract.balanceOf(_target.address, _targetID)
	return await expect(_expValue).to.be.eq(actual)
}
