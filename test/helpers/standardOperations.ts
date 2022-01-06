/**
 * Test function set:
 * contains most often-used state-chaning & testing functions
 * for CPR platform tests
 *
 * used for better visibility & shortening of CPR tests
 */

import { expect } from 'chai'
import { CargoAsset, CargoFactory, CargoFactory__factory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { getAssetID } from './getAssetId.helper'
import contractNames from '../../constants/contract.names'
import { getCargoAddress } from './cargoAddress'
import contract_names from '../../constants/contract.names'

let factoryContract: CargoFactory
let cargoContract: CargoAsset
let contractDecimals: BigNumber
let kycRegisterContract: KycRegister
let signer: SignerWithAddress

// default values

export function setFactory(factory: CargoFactory, kyc: KycRegister, decimals: BigNumber) {
	factoryContract = factory
	kycRegisterContract = kyc
	contractDecimals = decimals
}

export function setCargoAsset(asset: CargoAsset) {
	cargoContract = asset
}

export const create = {
	/**
	 * Asset creation feature set
	 *
	 * call 'specifier' methods to set local parameters for execution
	 * if none specifier methods called, default state variables will be used as parameters
	 */

	// local parameters
	localSigner: null,
	localReceiver: null,

	// specifier methods
	from(signer: SignerWithAddress) {
		this.localSigner = signer
		return this
	},
	to(receiver: SignerWithAddress) {
		this.localReceiver = receiver
		return this
	},

	// feature-set methods
	async root(uri: string, name: string, totalSupply: BigNumber) {
		if (this.localSigner == null) {
			// use global state
			this.localSigner = signer
		}
		// execute:
		const cargoAddress = await factoryContract
			.connect(this.localSigner)
			.createCargo(uri, name, contractDecimals, totalSupply, kycRegisterContract.address)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		const cargoAsset = ethers
			.getContractAt(contractNames.CARGO_ASSET, cargoAddress)
			.then(contract => contract as CargoAsset)

		// clear local parameters
		this.localSigner = null

		// return asset instance
		return cargoAsset
	},

	async child(pid: BigNumber, name: string, supply: BigNumber) {
		if (this.localSigner == null) {
			// use global state
			this.localSigner = signer
		}
		if (this.localReceiver == null) {
			// use global state
			this.localReceiver = signer
		}
		// execute:
		const childAsset = await cargoContract
			.connect(this.localSigner)
			.createChild(supply, pid, name, this.localReceiver.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		// clear local parameters
		this.localSigner = null

		// return asset instance
		return childAsset
	}
}

export const kyc = {
	/**
	 * Kyc feature set
	 *
	 * call 'specifier' methods to set local parameters for execution
	 * if none specifier methods called, default state variables will be used as parameters
	 */

	// local parameters
	localSigner: null,

	// specifier methods
	from(signer: SignerWithAddress) {
		this.localSigner = signer
		return this
	},

	// feature-set methods
	async instantiate() {
		return await ethers
			.getContractFactory(contract_names.KYC_REGISTER)
			.then(factory => factory.connect(this.localSigner).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)
	},

	async add(_target: SignerWithAddress) {
		return await kycRegisterContract.connect(this.localSigner).setKycStatus(_target.address, true)
	},

	async remove(_target: SignerWithAddress) {
		return await kycRegisterContract.connect(this.localSigner).setKycStatus(_target.address, false)
	}
}
