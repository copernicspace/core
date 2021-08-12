import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import ContractNames from '../../../constants/contract.names'
import { getAssetID } from '../../helpers/new-asset-id.helper'

/**
 * @returns fixture with space asset contract deployed by first wallet address
 */
export const assetContractFixture = async () => {
	const assetContract: Asset = await ethers
		.getContractFactory(ContractNames.spaceAsset)
		.then(factory => factory.deploy('test.uri'))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as Asset)

	return { assetContract }
}

/**
 * @returns waffle fixture, with space asset contract deployed,
 * and single public root asset id, created by second wallet address
 */
export const publicSpaceAsset = async () => {
	const { assetContract } = await waffle.loadFixture(assetContractFixture)
	const [, user]: SignerWithAddress[] = await ethers.getSigners()
	const publicId = await assetContract
		.connect(user)
		.createRoot(true, false, 0)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	return { assetContract, publicId }
}

/**
 * @returns waffle fixture, with space asset contract deployed,
 * and single private root asset id, created by second wallet address
 */
export const privateSpaceAsset = async () => {
	const { assetContract } = await waffle.loadFixture(assetContractFixture)
	const [, user]: SignerWithAddress[] = await ethers.getSigners()
	const privateId = await assetContract
		.connect(user)
		.createRoot(false, false, 0)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	return { assetContract, privateId }
}
