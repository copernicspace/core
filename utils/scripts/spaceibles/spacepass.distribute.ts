import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import fs from 'fs'
import Papa from 'papaparse'

class TransactionBuilder {
	private static tokenTypes = {
		Citizen: 1,
		Ambassador: 2
	}

	static buildFromPassport(passport: string) {
		const ids: number[] = []
		const amounts: number[] = []

		const passportData = passport.split('+').map(s => s.trim())

		for (const pd of passportData) {
			const splitData = pd.split(' ')
			let amount = 1
			let tokenType = splitData[0]

			if (splitData.length > 1) {
				amount = parseInt(splitData[0])
				tokenType = splitData[1]
			}

			const tokenId = this.tokenTypes[tokenType]
			if (tokenId) {
				ids.push(tokenId)
				amounts.push(amount)
			}
		}

		return {
			ids,
			amounts
		}
	}
}

async function main() {
	const name = contractNames.SPACEIBLE_ASSET
	const [deployer] = await ethers.getSigners()
	const addressPolygon = '0xF22fC4e1c0d13ab4943C9F087F0E96afC014546B'
	const addressMumbai = '0xff633F36452b3304F8EE7462F208537C7C1f7F10'
	const address = hre.network.name === 'mumbai' ? addressMumbai : addressPolygon
	const contract = await ethers.getContractAt(name, address, deployer)

	const csvIn = 'utils/scripts/data/csp-batch-4.csv'
	const csvData = fs.readFileSync(csvIn, 'utf8')

	const records = Papa.parse(csvData, {
		header: true,
		skip_empty_lines: true
	})

	const txs = []
	for (const record of records.data) {
		const from = deployer.address
		const to = record.address
		const { ids, amounts } = TransactionBuilder.buildFromPassport(record.passport)
		const data = '0x'
		await contract.safeBatchTransferFrom(from, to, ids, amounts, data).then(tx => {
			record.hash = tx.hash
			txs.push(tx)
		})
	}

	const updatedCsvData = Papa.unparse(records.data)
	fs.writeFileSync(csvIn, updatedCsvData)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
