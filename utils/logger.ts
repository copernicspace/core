enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARNING = 'WARNING',
	ERROR = 'ERROR'
}

class Logger {
	private static instance: Logger
	private lastTimestamp: number | null = null

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger()
		}
		return Logger.instance
	}

	private getColor(level: LogLevel): string {
		switch (level) {
			case LogLevel.DEBUG:
				return '\x1b[32m' // Green
			case LogLevel.INFO:
				return '\x1b[34m' // Blue
			case LogLevel.WARNING:
				return '\x1b[33m' // Yellow
			case LogLevel.ERROR:
				return '\x1b[31m' // Red
			default:
				return '\x1b[0m' // Reset color
		}
	}

	private getTimestamp(): string {
		const now = Date.now()
		const timeDiff = this.lastTimestamp ? `+${((now - this.lastTimestamp) / 1000).toFixed(2)}s` : '+0.00s'
		this.lastTimestamp = now
		return `${new Date(now).toISOString()} (${timeDiff})`
	}

	private log(level: LogLevel, message: string, args?: any): void {
		const color = this.getColor(level)
		const resetColor = '\x1b[0m'
		const timestamp = this.getTimestamp()
		const argString = args
			? '\n' +
			  Object.entries(args)
					.map(([k, v]) => `${k}: ${v}`)
					.join('\n')
			: ''
		console.log(`${color}${level}${resetColor} [${timestamp}]: ${message}${argString}`)
	}

	public debug(message: string, args?: any): void {
		this.log(LogLevel.DEBUG, message, args)
	}

	public info(message: string, args?: any): void {
		this.log(LogLevel.INFO, message, args)
	}

	public warning(message: string, args?: any): void {
		this.log(LogLevel.WARNING, message, args)
	}

	public error(message: string, args?: any): void {
		this.log(LogLevel.ERROR, message, args)
	}
}

export default Logger.getInstance()
