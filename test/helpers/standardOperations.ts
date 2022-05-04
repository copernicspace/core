/**
 * Test function set:
 * contains most often-used state-chaning & testing functions
 * for CPR platform tests
 *
 * used for better visibility & shortening of CPR tests
 */

import { PayloadAsset, PayloadFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { getAssetID } from './getAssetId.helper'
import contractNames from '../../constants/contract.names'
import { getPayloadAddress } from './payloadAddress'
import contract_names from '../../constants/contract.names'

let payloadFactory: PayloadFactory
let payloadAsset: PayloadAsset
let contractDecimals: BigNumber
let kycRegisterContract: KycRegister
let signer: SignerWithAddress

export const global = {
	/**
	 * Test preparation feature set
	 *
	 * get & set global parameters for the execution context
	 */

	set: {
		payloadFactory(factory: PayloadFactory) {
			payloadFactory = factory
		},
		payloadAsset(asset: PayloadAsset) {
			payloadAsset = asset
		},
		kycContract(kycRegister: KycRegister) {
			kycRegisterContract = kycRegister
		},
		contractDecimals(decimals: BigNumber) {
			contractDecimals = decimals
		},
		startSigner(_signer: SignerWithAddress) {
			signer = _signer
		}
	},

	get: {
		payloadFactory() {
			return payloadFactory
		},
		payloadAsset() {
			return payloadAsset
		},
		kycContract() {
			return kycRegisterContract
		},
		contractDecimals() {
			return contractDecimals
		},
		startSigner() {
			return signer
		}
	}
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
	localDecimals: null,
	localKyc: null,
	localAsset: null,

	// specifier methods (act as override to global parameters)
	from(signer: SignerWithAddress) {
		this.localSigner = signer
		return this
	},
	to(receiver: SignerWithAddress) {
		this.localReceiver = receiver
		return this
	},
	useDecimals(decimals: BigNumber) {
		this.localDecimals = decimals
		return this
	},
	useKyc(kycContract: KycRegister) {
		this.localKyc = kycContract
		return this
	},
	onContract(_payloadAsset: PayloadAsset) {
		this.localAsset = _payloadAsset
		return this
	},

	// feature-set methods
	async root(uri: string, name: string, totalSupply: BigNumber) {
		// check if local parameters specified
		if (this.localSigner == null) {
			// use global state
			this.localSigner = signer
		}
		if (this.localDecimals == null) {
			// use global state
			this.localDecimals = contractDecimals
		}
		if (this.localKyc == null) {
			// use global state
			this.localKyc = kycRegisterContract
		}
		// execute:
		const payloadAddress = await payloadFactory
			.connect(this.localSigner)
			.create(uri, name, this.localDecimals, totalSupply, this.localKyc.address, 0, false)
			.then(tx => tx.wait())
			.then(txr => getPayloadAddress(txr))

		const payloadAsset = ethers
			.getContractAt(contractNames.PAYLOAD_ASSET, payloadAddress)
			.then(contract => contract as PayloadAsset)

		// clear local parameters
		this.localSigner = null
		this.localDecimals = null
		this.localKyc = null

		// return asset instance
		return payloadAsset
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
		if (this.localAsset == null) {
			// use global state
			this.localAsset = payloadAsset
		}
		// execute:
		const childAsset = await this.localAsset
			.connect(this.localSigner)
			.createChild(supply, pid, name, this.localReceiver.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		// clear local parameters
		this.localSigner = null
		this.localAsset = null

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
	localKyc: null,

	// specifier methods (act as override to global parameters)
	from(signer: SignerWithAddress) {
		this.localSigner = signer
		return this
	},
	chooseKyc(kycContract: KycRegister) {
		this.localKyc = kycContract
		return this
	},

	// feature-set methods
	async instantiate() {
		if (this.localSigner == null) {
			// use global state
			this.localSigner = signer
		}

		const kycInstance = await ethers
			.getContractFactory(contract_names.KYC_REGISTER)
			.then(factory => factory.connect(this.localSigner).deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as KycRegister)

		// clear local parameters
		this.localSigner = null

		// return kyc instance
		return kycInstance
	},

	async add(_target: SignerWithAddress) {
		if (this.localKyc == null) {
			// use global state
			this.localKyc = kycRegisterContract
		}
		// execute:
		await this.localKyc.connect(this.localSigner).setKycStatus(_target.address, true)

		// clear local parameters
		this.localKyc = null
	},

	async remove(_target: SignerWithAddress) {
		if (this.localKyc == null) {
			// use global state
			this.localKyc = kycRegisterContract
		}
		// execute:
		await this.localKyc.connect(this.localSigner).setKycStatus(_target.address, false)

		// clear local parameters
		this.localKyc = null
	}
}
