import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import { logStart, logDeploy } from '../../log/logDetails'
import fs from 'fs/promises'
import path from 'path'
import { NFTStorage } from 'nft.storage'
import readFile from '../../fs/readFile'
import logger from '../../log/logger'
import { polygonScanLink } from '../../polygonScanLink'

const networkName = hre.network.name

const deployKycRegister = async () => {
	const contractName = contractNames.KYC_REGISTER
	const [deployer] = await ethers.getSigners()

	logStart({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address
	})

	const contract = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())

	const txr = await contract.deployTransaction.wait()
	logDeploy(txr, networkName)
	return { address: contract.address, block: txr.blockNumber }
}

const deploySpacepassAsset = async (kycAddress: string) => {
	const contractName = contractNames.SPACEPASS_ASSET
	const [deployer] = await ethers.getSigners()

	logStart({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address,
		wl: kycAddress
	})

	const contract = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy('ipfs://', kycAddress))
		.then(contract => contract.deployed())

	const txr = await contract.deployTransaction.wait()
	logDeploy(txr, networkName)
	return { address: contract.address, block: txr.blockNumber }
}

const deploySpacepassListing = async (assetAddress: string) => {
	const contractName = contractNames.SPACEPASS_LISTING
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address
	const operatorFee = '300'

	logStart({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address,
		operator: operator,
		operatorFee: operatorFee
	})

	const contract = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy(operator, operatorFee, assetAddress))
		.then(contract => contract.deployed())

	const txr = await contract.deployTransaction.wait()
	logDeploy(txr, networkName)
	return { address: contract.address, block: txr.blockNumber }
}

const verifyContract = (contract: any): void => {
	const { name, description, image, external_link, fee_recipient, seller_fee_basis_points } = contract
	if (!name) throw new Error('Contract object name is not defined')
	if (!description) throw new Error('Contract object description is not defined')
	if (!image) throw new Error('Contract object image is not defined')
	if (!external_link) throw new Error('Contract object external_link is not defined')
	if (!fee_recipient) throw new Error('Contract object fee_recipient is not defined')
	if (!seller_fee_basis_points) throw new Error('Contract object seller_fee_basis_points is not defined')
}

const postDeploy = async (assetAddress: string) => {
	try {
		logger.info('# post deploy procedure for spacepass 🌖🌗🌘🌑🌒🌓🌔 ', { assetAddress })
		// step 0: setup
		// step 0.0: get deployer as SignerWithAddress from ethersjs
		const [deployer] = await ethers.getSigners()
		// step 0.1 get domain based on network name
		const domain = networkName === 'mainnet' ? 'app' : 'stage'
		// step 0.2: get paths and external url
		const metadataPath = path.join(__dirname, '../../..', 'contracts/spaceibles/spacepass/metadata')
		const collectionExternalUrl = `https://${domain}.copernicspace.com/spaceibles?collection=spacepassport`
		const getCSPExternalUrl = (address: string, id: string) =>
			`https://${domain}.copernicspace.com/spaceibles/${address}-${id}`

		// # step 1.: update contract level metadata json
		logger.info('🟢 Starting  contract level metadata json update ...')
		// ## step 1.0: load json file into variable
		logger.info('loading contract json')
		const contractPath = path.join(metadataPath, 'contract.json')
		const contractJson = await fs.readFile(contractPath, 'utf8')
		const contract = JSON.parse(contractJson)
		// ## step 1.1: verify loaded contract object has next properties:
		// name, description, image, external_link, fee_recipient, seller_fee_basis_points
		logger.info('verifying loaded contract json')
		verifyContract(contract)

		// ## step 1.2: update contract object
		contract['fee_recipient'] = deployer.address
		contract['external_link'] = collectionExternalUrl
		logger.info('update contract metadata', { ...contract, description: '...' })

		// ## step 1.3: save contract object
		await fs.writeFile(contractPath, JSON.stringify(contract, null, 8))
		logger.info('save contract metadata')
		// ## step 1.4: verify saved contract object
		const updatedContractJson = await fs.readFile(contractPath, 'utf8')
		const updatedContract = JSON.parse(updatedContractJson)
		if (updatedContract['fee_recipient'] !== deployer.address)
			throw new Error('Contract object fee_recipient is not updated')
		logger.info('verify saved contract metadata', { ...updatedContract, description: '...' })
		verifyContract(updatedContract)
		logger.info('✅ Successfully updated contract metadata')

		// ## step 2: update and save token level metadata json
		// step 3.0: load json files into variables
		logger.info('🟢 Starting update token level metadata json ... ')
		const citizenPath = path.join(metadataPath, 'citizen.json')
		const ambassadorPath = path.join(metadataPath, 'ambassador.json')
		const astronautPath = path.join(metadataPath, 'astronaut.json')

		const citizenJson = await fs.readFile(citizenPath, 'utf8')
		const ambassadorJson = await fs.readFile(ambassadorPath, 'utf8')
		const astronautJson = await fs.readFile(astronautPath, 'utf8')

		const citizen = JSON.parse(citizenJson)
		const ambassador = JSON.parse(ambassadorJson)
		const astronaut = JSON.parse(astronautJson)

		// step 3.1: verify loaded token objects
		// @TODO add verification

		// step 3.2: update token objects
		citizen['external_url'] = getCSPExternalUrl(assetAddress, '1')
		ambassador['external_url'] = getCSPExternalUrl(assetAddress, '2')
		astronaut['external_url'] = getCSPExternalUrl(assetAddress, '3')

		// step 3.3: save token objects
		await fs.writeFile(citizenPath, JSON.stringify(citizen, null, 8))
		await fs.writeFile(ambassadorPath, JSON.stringify(ambassador, null, 8))
		await fs.writeFile(astronautPath, JSON.stringify(astronaut, null, 8))

		// step 3.4: verify saved token objects
		// @TODO add verification
		logger.info('citizen update:', { ...citizen, description: '...' })
		logger.info('ambassador update:', { ...ambassador, description: '...' })
		logger.info('astronaut update:', { ...astronaut, description: '...' })
		logger.info('✅ Successfully updated token metadata')

		// step 4: upload new metadata to ipfs
		logger.info('🟢 Starting upload metadata to IPFS ...')
		const token =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGZhNEYzRTc2NzE3MTFkNDhjNzY0Y2VhOTRiQWRiZWE1NDA2MjVGNDAiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5MTA0MzMzNzk0NSwibmFtZSI6ImNvcGVybmljIHNwYWNlIHBhc3Nwb3J0cyJ9.NIPpz9HM5GifffPpJ8U3OltkF375S4QC7XRI-msVhuE'
		const nftStorage = new NFTStorage({ token })
		const files = [
			await readFile(citizenPath),
			await readFile(ambassadorPath),
			await readFile(astronautPath),
			await readFile(contractPath)
		]
		const cid = await nftStorage.storeDirectory(files)
		logger.info('✅ Successfully uploaded metadata to IPFS', { cid })

		// step 5: set contract level metadata
		logger.info('🟢 Starting set contract level metadata ...')
		const assetContract = await ethers.getContractAt(contractNames.SPACEPASS_ASSET, assetAddress)
		const contractURI = `ipfs://${cid}/contract.json`
		const txr = await assetContract.setContractURI(contractURI).then(tx => tx.wait())
		logger.info('sending `setContractURI` tx', {
			contractURI,
			assetAddress
		})
		logger.info('✅ Successfully set contract level metadata', {
			hash: txr.transactionHash,
			block: txr.blockNumber,
			link: polygonScanLink(txr.transactionHash, networkName)
		})

		// step 6: mint collection
		logger.info('🟢 Minting collection ...')
		const citizenMintTxr = await assetContract.mint(`${cid}/citizen.json`, 1299, 300, '0x').then(tx => tx.wait())
		const ambassadorMintTxr = await assetContract
			.mint(`${cid}/ambassador.json`, 241, 300, '0x')
			.then(tx => tx.wait())
		const astronautMintTxr = await assetContract.mint(`${cid}/astronaut.json`, 3, 300, '0x').then(tx => tx.wait())
		logger.info('citizen mint tx', {
			hash: citizenMintTxr.transactionHash,
			block: citizenMintTxr.blockNumber,
			link: polygonScanLink(citizenMintTxr.transactionHash, networkName)
		})
		logger.info('ambassador mint tx', {
			hash: ambassadorMintTxr.transactionHash,
			block: ambassadorMintTxr.blockNumber,
			link: polygonScanLink(ambassadorMintTxr.transactionHash, networkName)
		})
		logger.info('astronaut mint tx', {
			hash: astronautMintTxr.transactionHash,
			block: astronautMintTxr.blockNumber,
			link: polygonScanLink(astronautMintTxr.transactionHash, networkName)
		})
		logger.info('✅ Successfully minted collection')
	} catch (error) {
		logger.error('During postDeploy', { error })
	} finally {
		logger.info('🟢 🦠 🦎 🌱 Post deploy procedure completed')
	}
}

async function main() {
	try {
		const { address: kycAddress, block: kycBlock } = await deployKycRegister()
		const { address: assetAddress, block: assetBlock } = await deploySpacepassAsset(kycAddress)
		const { address: listingAddress, block: listingBlock } = await deploySpacepassListing(assetAddress)
		await postDeploy(assetAddress)
		logger.info('Deploy info: ', {
			kycAddress,
			kycBlock,
			assetAddress,
			assetBlock,
			listingAddress,
			listingBlock
		})
		process.exit(0)
	} catch (error) {
		console.error(error)
		process.exit(1)
	}
}

main()
