import { ethers, waffle } from 'hardhat'
import { Fixture } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { Asset } from '../../../typechain'
import { BigNumber, ContractReceipt } from 'ethers'
import { getAssetID } from '../../helpers/new-asset-id.helper'

interface DivisibilityFixture {
	assetContract: Asset
	deployer: SignerWithAddress
}

interface DivisibilityFixtureWithWeight {
	assetContract: Asset
	deployer: SignerWithAddress
	rootUser: SignerWithAddress
	rootID: BigNumber
}

export const divisibilityFixture: Fixture<DivisibilityFixture> = async (): Promise<DivisibilityFixture> => {
	const [deployer]: SignerWithAddress[] = await ethers.getSigners()

	const assetContract: Asset = await ethers
		.getContractFactory('Asset')
		.then((factory) => factory.connect(deployer).deploy('TEST-URI'))
		.then((contract) => contract.deployed())
		.then((deployedContract) => deployedContract as Asset)

	return { assetContract, deployer }
}

export const divisibilityFixtureWithWeight: Fixture<DivisibilityFixtureWithWeight> =
	async (): Promise<DivisibilityFixtureWithWeight> => {
		const { assetContract, deployer } = await waffle.loadFixture(divisibilityFixture)

		const [rootUser]: SignerWithAddress[] = await ethers.getSigners()

		// create a divisible token with weight 5000
		const rootAssetTxr: ContractReceipt = await assetContract
			.connect(rootUser)
			.createRoot(true, true, 5000)
			.then((tx) => tx.wait())

		const rootID: BigNumber = getAssetID(rootAssetTxr)

		return { assetContract, deployer, rootUser, rootID }
	}
