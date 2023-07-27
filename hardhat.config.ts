import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import '@typechain/hardhat'
import 'hardhat-tracer'
import 'hardhat-gas-reporter'
import 'hardhat-log-remover'
import * as Mocha from 'mocha'
import * as fs from 'fs'
import './utils/tasks'

const loadSecret = () => {
	const secretPath = './secret.json'

	if (fs.existsSync(secretPath)) {
		return JSON.parse(fs.readFileSync(secretPath, 'utf8'))
	} else {
		// console.warn(
		// 'WARNING: secret.json not found. If you are trying to deploy - it will FAIL! See README for more details.'
		// )
		return {
			POLYGON_ALCHEMY_API: '',
			POLYGON_SEED: '',
			MUMBAI_ALCHEMY_API: '',
			MUMBAI_SEED: ''
		}
	}
}

const secret = loadSecret()
const config = {
	solidity: {
		version: '0.8.18',
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
			url: `https://polygon-mainnet.g.alchemy.com/v2/${secret?.POLYGON_ALCHEMY_API}`,
			accounts: {
				mnemonic: secret?.POLYGON_SEED
			}
		},
		mumbai: {
			url: `https://polygon-mumbai.g.alchemy.com/v2/${secret?.MUMBAI_ALCHEMY_API}`,
			accounts: {
				mnemonic: secret?.MUMBAI_SEED
			}
		},
		local: {
			url: 'http://127.0.0.1:8545',
			accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
		}
	},
	etherscan: {
		apiKey: ''
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
