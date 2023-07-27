import logger from './logger'
import { polygonScanLink } from './polygonScanLink'

export const logStart = args => logger.info('Start deploying new smart contract', args)

export const logDeploy = (txr, networkName) =>
	logger.info('contract successfully deployed ', {
		address: txr.contractAddress || txr.creates,
		block: txr.blockNumber,
		scanLink: polygonScanLink(txr.transactionHash || txr.hash, networkName)
	})
