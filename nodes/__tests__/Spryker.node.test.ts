
import { Spryker } from '../Spryker.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SprykerResourceFactory } from '../services/resourceFactory';
import { mock } from 'jest-mock-extended';

jest.mock('../services/resourceFactory');

describe('Spryker.node', () => {
	let node: Spryker;
	let executeFunctions: IExecuteFunctions;

	beforeEach(() => {
		node = new Spryker();
		executeFunctions = mock<IExecuteFunctions>();
		(executeFunctions.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
			if (name === 'resource') {
				return 'cmsPages';
			}
			if (name === 'operation') {
				return 'getAll';
			}
			return undefined;
		});
		(executeFunctions.getInputData as jest.Mock).mockReturnValue([{ json: {} }]);
		(executeFunctions.continueOnFail as jest.Mock).mockReturnValue(false);
	});

	it('should execute operation and return data', async () => {
		const mockResponse: INodeExecutionData[] = [{ json: { id: '1', name: 'Test Page' } }];
		(SprykerResourceFactory.prototype.executeOperation as jest.Mock).mockResolvedValue(mockResponse);

		const result = await node.execute.call(executeFunctions);

		expect(SprykerResourceFactory).toHaveBeenCalledWith(expect.any(Object), 0);
		expect(SprykerResourceFactory.prototype.executeOperation).toHaveBeenCalledWith('cmsPages', 'getAll');
		expect(result).toEqual([mockResponse]);
	});

	it('should handle errors and continue on fail if enabled', async () => {
		(executeFunctions.continueOnFail as jest.Mock).mockReturnValue(true);
		const errorMessage = 'Test Error';
		(SprykerResourceFactory.prototype.executeOperation as jest.Mock).mockRejectedValue(new Error(errorMessage));

		const result = await node.execute.call(executeFunctions);

		expect(result).toEqual([[{ json: { error: errorMessage } }]]);
	});

	it('should throw error if continueOnFail is disabled', async () => {
		const errorMessage = 'Test Error';
		(SprykerResourceFactory.prototype.executeOperation as jest.Mock).mockRejectedValue(new Error(errorMessage));

		await expect(node.execute.call(executeFunctions)).rejects.toThrow(errorMessage);
	});
});
