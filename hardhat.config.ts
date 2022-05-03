import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-tracer'
import 'hardhat-gas-reporter'
import 'hardhat-log-remover'
import * as Mocha from 'mocha'
import './tasks'

import * as secret from './secret'

const config = {
	solidity: {
		version: '0.8.9',
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
		},
		polygon: {
			url: `https://polygon-mainnet.g.alchemy.com/v2/${secret.POLYGON_ALCHEMY_API}`,
			accounts: {
				mnemonic: secret.POLYGON_SEED
			}
		},
		mumbai: {
			url: `https://polygon-mumbai.g.alchemy.com/v2/${secret.MUMBAI_ALCHEMY_API}`,
			accounts: {
				mnemonic: secret.MUMBAI_SEED
			}
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
