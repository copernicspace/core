import { task } from 'hardhat/config'
import contractNames from '../../constants/contract.names'

const TASK = {
	NAME: 'utils:bootstrap:devAccess',
	DESC: 'add dev addresses to kyc and factory',

	PARAMS: {
		KYC_ADDRESS: 'kycAddress',
		KYC_ADDRESS_DESC: 'amount of tokens to be minted in decimal format',

		FACTORY_ADDRESS: 'factoryAddress',
		FACTORY_ADDRESS_DESC: 'address of erc20mock token'
	}
}

const devs = {
	alexander: {
		seller: '0x3F8D20A655c065B07E958934125f872A6b186dAd',
		buyer: '0x032574757a450852A2B33285491824cf7Ecb152A'
	},
	alex: {
		seller: '0x2e1fDE82eFc7802Ed381C6c67e2b2cb17Bb45F7D',
		buyer: '0x1C959da2dffBc213F831Ae7Dc363e066464991df'
	},
	stas: {
		seller: '0xfeAb83188C7A337b48Bc7375C5E43915401F8C4c',
		buyer: '0x1a7562d160D72DbF39673528960511c0a0735a49'
	},
	sasha: {
		seller: '0xD8Ba5F23ab8B7a07B5EC2500B872D2B94Ee856D0',
		buyer: '0x344aB3dF4a8d4bE67856e8E44359eBF4e7c68301'
	},
	pylyp: {
		seller: '0xDa76D71FA9ac775053dE8739CE5491041e392428',
		buyer: '0x305934Fe9173D1251E3687ecEb6073420C96CBfE'
	},
	jerzy: {
		seller: '0xD378748946A7DfCa8303beF5eb2F6ba762acd525',
		buyer: ''
	}
}

const testers = {
	oleg: {
		seller: '0x61Ef32e333C1aaa648371462Fe81f9710Ae86E0a',
		buyer: '0xD7FfDb4ed0ab71fbAc17a3d8b92aA0B251787dF4'
	}
}

const bizDevs = {
	blake: {
		seller: '0x1E7f48F1682a7bdC3B04a5379df4017ad563c710',
		buyer: '0x04Ae5D507C004992b4b4c72aea5f09dEcB284C43'
	},
	gb: {
		seller: '',
		buyer: '0x04Ae5D507C004992b4b4c72aea5f09dEcB284C43'
	}
}

const kycAddresses = [
	devs.alexander.seller,
	devs.alexander.buyer,
	devs.alex.seller,
	devs.alex.buyer,
	devs.stas.seller,
	devs.stas.buyer,
	devs.sasha.seller,
	devs.sasha.buyer,
	devs.pylyp.seller,
	devs.pylyp.buyer,
	devs.jerzy.seller,
	devs.jerzy.buyer,
	testers.oleg.buyer,
	testers.oleg.seller,
	bizDevs.blake.seller,
	bizDevs.blake.buyer,
	bizDevs.gb.seller,
	bizDevs.gb.buyer
]

const factoryAddresses = [
	devs.alexander.seller,
	devs.alex.seller,
	devs.stas.seller,
	devs.sasha.seller,
	devs.pylyp.seller,
	devs.jerzy.seller,
	testers.oleg.seller,
	bizDevs.blake.seller,
	bizDevs.gb.seller
]

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.FACTORY_ADDRESS, TASK.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(TASK.PARAMS.KYC_ADDRESS, TASK.PARAMS.KYC_ADDRESS_DESC)
	.setAction(async ({ kycAddress, factoryAddress }, hre) => {
		const kycContract = await hre.ethers.getContractAt(contractNames.KYC_REGISTER, kycAddress)
		const factoryContract = await hre.ethers.getContractAt(contractNames.PAYLOAD_FACTORY, factoryAddress)

		console.log('===========≠≠≠≠≠≠≠≠≠≠===========')
		console.log(` 🙅‍♀️ adding to KYC list ${kycAddress} ...`)
		for (const address of kycAddresses) {
			if (address !== '') {
				console.log(`\t  setting KYC status for ${address}`)
				const isKyc = await kycContract.getKycStatusInfo(address)
				if (isKyc) {
					console.log(`\t : ❎  already is on KYC list`)
				} else {
					await kycContract
						.setKycStatus(address, true)
						.then(tx => tx.wait())
						.then(txr => console.log(`\t\t✅ tx.hash: ${txr.transactionHash}\n`))
				}
			}
		}

		console.log('===========≠≠≠≠≠≠≠≠≠≠===========')
		console.log(`👨‍🏭 setting ${factoryAddress} factory clients ...\n`)
		for (const address of factoryAddresses) {
			if (address !== '') {
				console.log(`\tadding ${address} as factory client`)
				const role = await factoryContract.FACTORY_CLIENT()
				const isClient = await factoryContract.hasRole(role, address)
				if (isClient) {
					console.log(`\t : ❎  already has factory client role`)
				} else {
					await factoryContract
						.addClient(address)
						.then(tx => tx.wait())
						.then(txr => console.log(`\t\t✅ tx.hash: ${txr.transactionHash}\n`))
				}
			}
		}
	})
