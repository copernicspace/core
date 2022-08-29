import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'

import { getPayloadAddress } from '../../../../helpers/payloadAddress'
import contractNames from '../../../../../constants/contract.names'
import { deployPayloadAsset, Deploy } from './deploy.fixture'
import { PayloadAsset } from '../../../../../typechain'

export interface Create extends Deploy {
	payloadAsset: PayloadAsset
	totalSupply: BigNumber
	decimals: number
}

export const createPayloadAsset: Fixture<Create> = async () => deploy({ paused: false, royalties: '0' })

export const createPayloadAssetPaused: Fixture<Create> = async () => deploy({ paused: true, royalties: '0' })

export const createPayloadAssetWithRoyalties: Fixture<Create> = async () => deploy({ paused: false, royalties: '5' })

export const createPayloadAssetWithFloatRoyalties: Fixture<Create> = async () =>
	deploy({ paused: false, royalties: '5.725' })

const deploy = async (props: { paused: boolean; royalties: string }) => {
	const fixtureLoader = waffle.createFixtureLoader()
	const { deployer, creator, payloadFactory, kycContract } = await fixtureLoader(deployPayloadAsset)
	const decimals = 18
	const totalSupply = parseUnits('3500', decimals)

	await payloadFactory.connect(deployer).addClient(creator.address)
	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const payloadContractAddress = await payloadFactory
		.connect(creator)
		.create(
			'test.uri.com',
			'rootSpacePayloadName',
			decimals,
			totalSupply,
			kycContract.address,
			parseUnits(props.royalties, decimals),
			props.paused
		)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, payloadContractAddress)
		.then(contract => contract as PayloadAsset)

	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}
