import { task } from 'hardhat/config'

export const SET_KYC_STATUS = {
	NAME: 'kycRegister:setStatus',
	DESC: 'set kyc status for address',
	CONTRACT_NAME: 'KycRegister',

	PARAMS: {
		FACTORY_ADDRESS: 'kyc',
		FACTORY_ADDRESS_DESC: 'address of deployed kyc contract',

		CLIENT_ADDRESS: 'client',
		CLIENT_ADDRESS_DESC: 'address of new client to set kyc status',

		STATUS: 'status',
		STATUS_DESC: 'kyc status to set'
	}
}

export default task(SET_KYC_STATUS.NAME, SET_KYC_STATUS.DESC)
	.addParam(SET_KYC_STATUS.PARAMS.FACTORY_ADDRESS, SET_KYC_STATUS.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(SET_KYC_STATUS.PARAMS.CLIENT_ADDRESS, SET_KYC_STATUS.PARAMS.CLIENT_ADDRESS_DESC)
	.addParam(SET_KYC_STATUS.PARAMS.STATUS, SET_KYC_STATUS.PARAMS.STATUS_DESC)

	.setAction(
		async ({ kyc, client, status }, hre) =>
			await hre.ethers
				.getContractAt(SET_KYC_STATUS.CONTRACT_NAME, kyc)
				.then(contract => contract.setKycStatus(client, status))
				.then(tx => console.log(tx.hash))
	)
