enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARNING = 'WARNING',
	ERROR = 'ERROR'
}

class Logger {
	private lastTimestamp: number | null = null

	private timestamp(): string {
		const now = Date.now()
		let diff = ''

		if (this.lastTimestamp) {
			const timeDifference = (now - this.lastTimestamp) / 1000
			diff = ` (+${timeDifference.toFixed(2)}s)`
		}

		this.lastTimestamp = now

		return new Date(now).toISOString() + diff
	}

	private log(level: LogLevel, message: string, args?: object): void {
		let color: string
		let logFunction: (msg: string) => void

		switch (level) {
			case LogLevel.DEBUG:
				color = '\x1b[32m' // Green
				logFunction = console.debug
				break
			case LogLevel.INFO:
				color = '\x1b[34m' // Blue
				logFunction = console.log
				break
			case LogLevel.WARNING:
				color = '\x1b[33m' // Yellow
				logFunction = console.warn
				break
			case LogLevel.ERROR:
				color = '\x1b[31m' // Red
				logFunction = console.error
				break
			default:
				color = '\x1b[37m' // White
				logFunction = console.log
		}

		const resetColor = '\x1b[0m'
		const coloredLevel = `${color}${level.padEnd(7)}${resetColor}` // Padding the level string
		let logMessage = `[${this.timestamp()}] ${coloredLevel}: ${message}`

		if (args) {
			logMessage += '\n' + JSON.stringify(args, null, 2)
		}

		logFunction(logMessage)
	}

	public debug(message: string, args?: object): void {
		this.log(LogLevel.DEBUG, message, args)
	}

	public info(message: string, args?: object): void {
		this.log(LogLevel.INFO, message, args)
	}

	public warning(message: string, args?: object): void {
		this.log(LogLevel.WARNING, message, args)
	}

	public error(message: string, args?: object): void {
		this.log(LogLevel.ERROR, message, args)
	}
}

export default new Logger()
