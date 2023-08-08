import { logDeploy, logStart } from '../log/logDetails'
import logger from '../log/logger'

const main = async () => {
	logger.debug('test debug msg', { var: 1 })
	logStart({
		contractName: 'SpacePassAsset',
		network: 'Polygon spacenet',
		deployer: '0xdC0eC09Dc91E6e90F28adeb20b1Fa3f45C9dC663'
	})

	logDeploy(
		{ transctionHash: '0xc879c4ef223362c19d64d82163f2e2a93546bf3911f39308ac6216e17f1008ac' },
		'polygon spacenet'
	)
}
main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
