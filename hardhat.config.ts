import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
// import '@nomiclabs/hardhat-etherscan'
import '@typechain/hardhat'
import 'hardhat-tracer'
import 'hardhat-gas-reporter'
import 'hardhat-log-remover'
import * as Mocha from 'mocha'
import * as fs from 'fs'
import './utils/tasks'
import '@nomicfoundation/hardhat-verify'

const loadSecret = () => {
	const secretPath = './secret.json'

	if (fs.existsSync(secretPath)) {
		return JSON.parse(fs.readFileSync(secretPath, 'utf8'))
	} else {
		return {
			POLYGON_ALCHEMY_API: '',
			POLYGON_SEED: '',
			POLYGON_SCAN_API_KEY: '',
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
			},
			gasPrice: 100000000000
		},
		mumbai: {
			url: `https://polygon-mumbai.g.alchemy.com/v2/${secret?.MUMBAI_ALCHEMY_API}`,
			accounts: {
				mnemonic: secret?.MUMBAI_SEED
			}
		},
		local: {
			url: 'http://127.0.0.1:8545',
			accounts: {
				mnemonic: secret?.LOCAL_SEED
			}
		}
	},
	etherscan: {
		apiKey: secret?.POLYGON_SCAN_API_KEY
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
