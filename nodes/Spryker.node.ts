import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
} from 'n8n-workflow';

import { sprykerNodeConfig } from './config/nodeConfigWithLogging';
import { SprykerResourceFactory } from './services/resourceFactory';
import { SprykerResource, SprykerOperation, SprykerExecutionContext } from './types';
import { SprykerLogger, SprykerLogEntry } from './services/sprykerLogger';
import { getLoggingStats, cleanupOldLogs } from './utils/requestWithLogging';

export class Spryker implements INodeType {
	description = sprykerNodeConfig;
	icon = sprykerNodeConfig.icon;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as SprykerResource;
		const operation = this.getNodeParameter('operation', 0) as SprykerOperation;

		// Initialize logging
		const enableLogging = this.getNodeParameter('enableLogging', 0) as boolean;
		const loggingOptions = this.getNodeParameter('loggingOptions', 0) as any;
		
		const logger = SprykerLogger.getInstance();
		logger.setEnabled(enableLogging);

		// Log execution start
		if (enableLogging) {
			console.log(`Spryker node execution started: ${resource}.${operation} (${items.length} items)`);
			console.log(`Logging enabled with options:`, loggingOptions);
		}

		// Create execution context adapter
		const context: SprykerExecutionContext = {
			getNodeParameter: this.getNodeParameter.bind(this),
			getCredentials: this.getCredentials.bind(this),
			helpers: this.helpers,
			getNode: this.getNode.bind(this),
		};

		// Periodic cleanup of old logs (run occasionally)
		if (enableLogging && Math.random() < 0.1) { // 10% chance
			try {
				const retentionDays = loggingOptions?.logRetentionDays || 30;
				const cleanedCount = cleanupOldLogs(retentionDays);
				if (cleanedCount > 0) {
					console.log(`Cleaned up ${cleanedCount} old log files`);
				}
			} catch (error) {
				console.warn('Failed to cleanup old logs:', error.message);
			}
		}

		const executionStartTime = Date.now();
		let successCount = 0;
		let errorCount = 0;

		for (let i = 0; i < items.length; i++) {
			try {
				const resourceFactory = new SprykerResourceFactory(context, i);
				const responseData = await resourceFactory.executeOperation(resource, operation);

				if (Array.isArray(responseData)) {
					returnData.push(...responseData);
				} else {
					returnData.push({ json: responseData });
				}

				successCount++;
			} catch (error) {
				errorCount++;
				
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		const executionTime = Date.now() - executionStartTime;

		// Log execution summary
		if (enableLogging) {
			console.log(`Spryker node execution completed: ${successCount} successful, ${errorCount} errors, ${executionTime}ms total`);
			
			// Log statistics
			const stats = getLoggingStats();
			console.log('Logging statistics:', stats);

			// Add execution summary to return data if requested
			if (loggingOptions?.includeExecutionSummary) {
				returnData.push({
					json: {
						_executionSummary: {
							resource,
							operation,
							itemsProcessed: items.length,
							successCount,
							errorCount,
							executionTime,
							loggingStats: stats,
						}
					}
				});
			}
		}

		return [returnData];
	}

	/**
	 * Get logging statistics for monitoring
	 */
	static getLoggingStatistics(): any {
		return getLoggingStats();
	}

	/**
	 * Search logs by criteria
	 */
	static searchLogs(criteria: {
		operation?: string;
		resource?: string;
		statusCode?: number;
		fromDate?: Date;
		toDate?: Date;
		hasError?: boolean;
	}): SprykerLogEntry[] {
		const logger = SprykerLogger.getInstance();
		return logger.searchLogs(criteria);
	}

	/**
	 * Get recent log entries
	 */
	static getRecentLogs(limit: number = 100): SprykerLogEntry[] {
		const logger = SprykerLogger.getInstance();
		const logFiles = logger.getLogFiles();
		
		if (logFiles.length === 0) {
			return [];
		}

		// Get entries from the most recent log file
		const recentEntries = logger.readLogFile(logFiles[0]);
		return recentEntries.slice(-limit).reverse(); // Most recent first
	}

	/**
	 * Clean up old log files
	 */
	static cleanupLogs(daysToKeep: number = 30): number {
		return cleanupOldLogs(daysToKeep);
	}

	/**
	 * Get log file information
	 */
	static getLogFileInfo(): {
		logFiles: string[];
		currentLogFile: string;
		totalSize: number;
		logDirectory: string;
	} {
		const logger = SprykerLogger.getInstance();
		const stats = logger.getLogStats();
		const logFiles = logger.getLogFiles();
		
		// Calculate total size of log files
		let totalSize = 0;
		try {
			const fs = require('fs');
			const path = require('path');
			
			for (const file of logFiles) {
				const filePath = path.join(stats.logDirectory, file);
				const fileStats = fs.statSync(filePath);
				totalSize += fileStats.size;
			}
		} catch (error) {
			console.warn('Failed to calculate log file sizes:', error.message);
		}

		return {
			logFiles,
			currentLogFile: stats.currentLogFile,
			totalSize,
			logDirectory: stats.logDirectory,
		};
	}

	/**
	 * Export logs to a specific format
	 */
	static exportLogs(
		format: 'json' | 'csv' | 'txt' = 'json',
		criteria?: {
			operation?: string;
			resource?: string;
			fromDate?: Date;
			toDate?: Date;
		}
	): string {
		const logger = SprykerLogger.getInstance();
		const entries = criteria ? logger.searchLogs(criteria) : logger.searchLogs({});

		switch (format) {
			case 'csv':
				return exportToCsv(entries);
			case 'txt':
				return exportToText(entries);
			case 'json':
			default:
				return JSON.stringify(entries, null, 2);
		}
	}
}

/**
 * Export log entries to CSV format
 */
function exportToCsv(entries: SprykerLogEntry[]): string {
	if (entries.length === 0) {
		return 'No log entries found';
	}

	const headers = [
		'Timestamp',
		'Request ID',
		'Operation',
		'Resource',
		'Method',
		'URL',
		'Status Code',
		'Response Time',
		'Error',
	];

	const rows = entries.map(entry => [
		entry.timestamp,
		entry.requestId,
		entry.operation,
		entry.resource,
		entry.request.method,
		entry.request.url,
		entry.response?.statusCode || '',
		entry.response?.responseTime || '',
		entry.error?.message || '',
	]);

	return [headers, ...rows]
		.map(row => row.map(cell => `"${cell}"`).join(','))
		.join('\n');
}

/**
 * Export log entries to text format
 */
function exportToText(entries: SprykerLogEntry[]): string {
	if (entries.length === 0) {
		return 'No log entries found';
	}

	return entries.map(entry => {
		const lines = [
			`[${entry.timestamp}] ${entry.operation}.${entry.resource} (${entry.requestId})`,
			`  Request: ${entry.request.method} ${entry.request.url}`,
		];

		if (entry.response) {
			lines.push(`  Response: ${entry.response.statusCode} (${entry.response.responseTime}ms)`);
		}

		if (entry.error) {
			lines.push(`  Error: ${entry.error.message}`);
		}

		return lines.join('\n');
	}).join('\n\n');
}
