import logger from './logger'
import { polygonScanLink } from './polygonScanLink'

export const logPreDeployDetails = args => logger.info('Start deploying new smart contract', args)

export const logDeployDetails = (txr, networkName) =>
	logger.info('contract successfully deployed ', {
		address: txr.contractAddress,
		block: txr.blockNumber,
		scanLink: polygonScanLink(txr.transactionHash, networkName)
	})
