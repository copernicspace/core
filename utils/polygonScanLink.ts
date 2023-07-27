export const polygonScanLink = (hash: string, network: string) => {
	const scanSubdomain = network === 'polygon' ? '' : network.concat('.')
	return `https://${scanSubdomain}polygonscan.com/tx/${hash}`
}
