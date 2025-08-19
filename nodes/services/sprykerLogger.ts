import * as fs from 'fs';
import * as path from 'path';
import { IRequestOptions } from 'n8n-workflow';

export interface SprykerLogEntry {
	timestamp: string;
	requestId: string;
	nodeExecutionId?: string;
	workflowId?: string;
	operation: string;
	resource: string;
	request: {
		method: string;
		url: string;
		headers: Record<string, any>;
		body?: any;
	};
	response?: {
		statusCode: number;
		headers: Record<string, any>;
		body: any;
		responseTime: number;
	};
	error?: {
		message: string;
		code?: string;
		statusCode?: number;
	};
}

export class SprykerLogger {
	private static instance: SprykerLogger;
	private logsDir: string;
	private currentLogFile: string;
	private logBuffer: SprykerLogEntry[] = [];
	private bufferSize: number = 10; // Write to file every 10 entries
	private flushInterval: NodeJS.Timeout | null = null;
	private isEnabled: boolean = false;

	private constructor() {
		// Get the project root directory (where package.json is located)
		const projectRoot = this.findProjectRoot();
		this.logsDir = path.join(projectRoot, 'logs', 'spryker');
		this.ensureLogDirectory();
		this.currentLogFile = this.generateLogFileName();
		
		// Flush buffer every 30 seconds
		this.flushInterval = setInterval(() => {
			this.flushBuffer();
		}, 30000);

		// Flush buffer on process exit
		process.on('exit', () => this.flushBuffer());
		process.on('SIGINT', () => this.flushBuffer());
		process.on('SIGTERM', () => this.flushBuffer());
	}

	public static getInstance(): SprykerLogger {
		if (!SprykerLogger.instance) {
			SprykerLogger.instance = new SprykerLogger();
		}
		return SprykerLogger.instance;
	}

	/**
	 * Enable or disable logging
	 */
	public setEnabled(enabled: boolean): void {
		this.isEnabled = enabled;
		if (enabled) {
			console.log(`Spryker API logging enabled. Logs will be saved to: ${this.logsDir}`);
		}
	}

	/**
	 * Check if logging is enabled
	 */
	public isLoggingEnabled(): boolean {
		return this.isEnabled;
	}

	/**
	 * Log a Spryker API request
	 */
	public logRequest(
		requestOptions: IRequestOptions,
		operation: string,
		resource: string,
		context?: {
			nodeExecutionId?: string;
			workflowId?: string;
		}
	): string {
		if (!this.isEnabled) {
			return '';
		}

		const requestId = this.generateRequestId();
		const logEntry: SprykerLogEntry = {
			timestamp: new Date().toISOString(),
			requestId,
			nodeExecutionId: context?.nodeExecutionId,
			workflowId: context?.workflowId,
			operation,
			resource,
			request: {
				method: requestOptions.method || 'GET',
				url: requestOptions.uri || '',
				headers: this.sanitizeHeaders(requestOptions.headers || {}),
				body: requestOptions.body,
			},
		};

		this.addToBuffer(logEntry);
		return requestId;
	}

	/**
	 * Log a Spryker API response
	 */
	public logResponse(
		requestId: string,
		response: any,
		responseTime: number,
		statusCode: number = 200,
		headers: Record<string, any> = {}
	): void {
		if (!this.isEnabled || !requestId) {
			return;
		}

		// Find the corresponding request in buffer
		const logEntry = this.findLogEntryInBuffer(requestId);
		if (logEntry) {
			logEntry.response = {
				statusCode,
				headers: this.sanitizeHeaders(headers),
				body: response,
				responseTime,
			};
		}
	}

	/**
	 * Log a Spryker API error
	 */
	public logError(
		requestId: string,
		error: any,
		responseTime?: number
	): void {
		if (!this.isEnabled || !requestId) {
			return;
		}

		const logEntry = this.findLogEntryInBuffer(requestId);
		if (logEntry) {
			logEntry.error = {
				message: error.message || 'Unknown error',
				code: error.code,
				statusCode: error.statusCode,
			};

			if (responseTime !== undefined) {
				logEntry.response = {
					statusCode: error.statusCode || 500,
					headers: {},
					body: null,
					responseTime,
				};
			}
		}
	}

	/**
	 * Get log file path for current session
	 */
	public getCurrentLogFile(): string {
		return path.join(this.logsDir, this.currentLogFile);
	}

	/**
	 * Get all log files
	 */
	public getLogFiles(): string[] {
		try {
			return fs.readdirSync(this.logsDir)
				.filter(file => file.endsWith('.json'))
				.sort()
				.reverse(); // Most recent first
		} catch (error) {
			return [];
		}
	}

	/**
	 * Clean up old log files (keep last 30 days)
	 */
	public cleanupOldLogs(daysToKeep: number = 30): number {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
		
		let deletedCount = 0;
		const logFiles = this.getLogFiles();

		for (const file of logFiles) {
			const filePath = path.join(this.logsDir, file);
			try {
				const stats = fs.statSync(filePath);
				if (stats.mtime < cutoffDate) {
					fs.unlinkSync(filePath);
					deletedCount++;
				}
			} catch (error) {
				console.warn(`Failed to process log file ${file}:`, error.message);
			}
		}

		return deletedCount;
	}

	/**
	 * Get log statistics
	 */
	public getLogStats(): {
		totalLogFiles: number;
		currentLogFile: string;
		bufferSize: number;
		isEnabled: boolean;
		logDirectory: string;
	} {
		return {
			totalLogFiles: this.getLogFiles().length,
			currentLogFile: this.currentLogFile,
			bufferSize: this.logBuffer.length,
			isEnabled: this.isEnabled,
			logDirectory: this.logsDir,
		};
	}

	/**
	 * Read log entries from a specific log file
	 */
	public readLogFile(fileName: string): SprykerLogEntry[] {
		const filePath = path.join(this.logsDir, fileName);
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			return content.split('\n')
				.filter(line => line.trim())
				.map(line => JSON.parse(line));
		} catch (error) {
			console.warn(`Failed to read log file ${fileName}:`, error.message);
			return [];
		}
	}

	/**
	 * Search log entries by criteria
	 */
	public searchLogs(criteria: {
		operation?: string;
		resource?: string;
		statusCode?: number;
		fromDate?: Date;
		toDate?: Date;
		hasError?: boolean;
	}): SprykerLogEntry[] {
		const results: SprykerLogEntry[] = [];
		const logFiles = this.getLogFiles();

		for (const file of logFiles) {
			const entries = this.readLogFile(file);
			for (const entry of entries) {
				if (this.matchesCriteria(entry, criteria)) {
					results.push(entry);
				}
			}
		}

		return results.sort((a, b) => 
			new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);
	}

	/**
	 * Force flush the buffer to disk
	 */
	public flushBuffer(): void {
		if (this.logBuffer.length === 0) {
			return;
		}

		try {
			const logFilePath = path.join(this.logsDir, this.currentLogFile);
			const logLines = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
			
			fs.appendFileSync(logFilePath, logLines, 'utf8');
			this.logBuffer = [];
		} catch (error) {
			console.error('Failed to write log buffer to file:', error.message);
		}
	}

	/**
	 * Destroy the logger instance (for testing)
	 */
	public destroy(): void {
		if (this.flushInterval) {
			clearInterval(this.flushInterval);
			this.flushInterval = null;
		}
		this.flushBuffer();
		SprykerLogger.instance = null as any;
	}

	// Private methods

	private findProjectRoot(): string {
		let currentDir = __dirname;
		
		while (currentDir !== path.dirname(currentDir)) {
			const packageJsonPath = path.join(currentDir, 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				return currentDir;
			}
			currentDir = path.dirname(currentDir);
		}
		
		// Fallback to current directory
		return process.cwd();
	}

	private ensureLogDirectory(): void {
		try {
			if (!fs.existsSync(this.logsDir)) {
				fs.mkdirSync(this.logsDir, { recursive: true });
			}
		} catch (error) {
			console.error('Failed to create log directory:', error.message);
		}
	}

	private generateLogFileName(): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
		return `spryker-api-${dateStr}.json`;
	}

	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
		const sanitized = { ...headers };
		
		// Remove sensitive information
		if (sanitized.Authorization) {
			sanitized.Authorization = '[REDACTED]';
		}
		
		if (sanitized.authorization) {
			sanitized.authorization = '[REDACTED]';
		}

		return sanitized;
	}

	private addToBuffer(logEntry: SprykerLogEntry): void {
		this.logBuffer.push(logEntry);
		
		// Check if we need to rotate log file (new day)
		const currentDate = new Date().toISOString().split('T')[0];
		const expectedFileName = `spryker-api-${currentDate}.json`;
		
		if (this.currentLogFile !== expectedFileName) {
			this.flushBuffer();
			this.currentLogFile = expectedFileName;
		}

		// Flush buffer if it's full
		if (this.logBuffer.length >= this.bufferSize) {
			this.flushBuffer();
		}
	}

	private findLogEntryInBuffer(requestId: string): SprykerLogEntry | undefined {
		return this.logBuffer.find(entry => entry.requestId === requestId);
	}

	private matchesCriteria(entry: SprykerLogEntry, criteria: any): boolean {
		if (criteria.operation && entry.operation !== criteria.operation) {
			return false;
		}

		if (criteria.resource && entry.resource !== criteria.resource) {
			return false;
		}

		if (criteria.statusCode && entry.response?.statusCode !== criteria.statusCode) {
			return false;
		}

		if (criteria.hasError !== undefined) {
			const hasError = !!entry.error;
			if (criteria.hasError !== hasError) {
				return false;
			}
		}

		if (criteria.fromDate) {
			const entryDate = new Date(entry.timestamp);
			if (entryDate < criteria.fromDate) {
				return false;
			}
		}

		if (criteria.toDate) {
			const entryDate = new Date(entry.timestamp);
			if (entryDate > criteria.toDate) {
				return false;
			}
		}

		return true;
	}
}
