import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'

import { getPayloadAddress } from '../../../../helpers/payloadAddress'
import contractNames from '../../../../../utils/constants/contract.names'
import { deployPayloadAsset, Deploy } from './deploy.fixture'
import { PayloadAsset } from '../../../../../typechain'

export interface Create extends Deploy {
	payloadAsset: PayloadAsset
	totalSupply: BigNumber
	decimals: number
}

export const createPayloadAsset: Fixture<Create> = async () => deploy({ paused: false, royalties: '0', decimals: 18 })

export const createPayloadAssetWithDecimalsEq6: Fixture<Create> = async () =>
	deploy({ paused: false, royalties: '0', decimals: 6 })

export const createPayloadAssetPaused: Fixture<Create> = async () =>
	deploy({ paused: true, royalties: '0', decimals: 18 })

export const createPayloadAssetWithRoyalties: Fixture<Create> = async () =>
	deploy({ paused: false, royalties: '5', decimals: 18 })

export const createPayloadAssetWithFloatRoyalties: Fixture<Create> = async () =>
	deploy({ paused: false, royalties: '5.75', decimals: 18 })

const deploy = async (props: { paused: boolean; royalties: string; decimals: number }) => {
	const fixtureLoader = waffle.createFixtureLoader()
	const { deployer, creator, payloadFactory, kycContract } = await fixtureLoader(deployPayloadAsset)
	const totalSupply = parseUnits('3500', props.decimals)

	await payloadFactory.connect(deployer).addClient(creator.address)
	await kycContract.connect(deployer).setKycStatus(creator.address, true)

	const payloadContractAddress = await payloadFactory
		.connect(creator)
		.create(
			'ipfs://',
			'rootSpacePayloadName',
			props.decimals,
			totalSupply,
			kycContract.address,
			parseUnits(props.royalties, props.decimals),
			props.paused,
			'TEST_ROOT_CID'
		)
		.then(tx => tx.wait())
		.then(txr => getPayloadAddress(txr))

	const payloadAsset = await ethers
		.getContractAt(contractNames.PAYLOAD_ASSET, payloadContractAddress)
		.then(contract => contract as PayloadAsset)

	const decimals = props.decimals
	return { deployer, creator, payloadFactory, kycContract, payloadAsset, totalSupply, decimals }
}
