import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-tracer'
import * as Mocha from 'mocha'

const config = {
	solidity: {
		version: '0.8.4',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	},
	networks: {
		docker: {
			url: 'http://host.docker.internal:8545'
		}
	},
	typechain: {
		outDir: 'typechain',
		target: 'ethers-v5'
	},
	mocha: {
		reporter: Mocha.reporters.Spec
	}
}

export default config
