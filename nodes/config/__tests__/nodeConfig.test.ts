
import { sprykerNodeConfig } from '../nodeConfig';

describe('sprykerNodeConfig', () => {
	it('should have a display name', () => {
		expect(sprykerNodeConfig.displayName).toBeDefined();
		expect(typeof sprykerNodeConfig.displayName).toBe('string');
	});

	it('should have a name', () => {
		expect(sprykerNodeConfig.name).toBeDefined();
		expect(typeof sprykerNodeConfig.name).toBe('string');
	});

	it('should have a version', () => {
		expect(sprykerNodeConfig.version).toBeDefined();
		expect(typeof sprykerNodeConfig.version).toBe('number');
	});

	it('should have properties defined', () => {
		expect(sprykerNodeConfig.properties).toBeDefined();
		expect(Array.isArray(sprykerNodeConfig.properties)).toBe(true);
		expect(sprykerNodeConfig.properties.length).toBeGreaterThan(0);
	});

	// You can add more specific tests for individual properties if needed
	// For example, to check if 'baseUrl' property exists and has correct type
	it('should have a baseUrl property', () => {
		const baseUrlProperty = sprykerNodeConfig.properties.find(prop => prop.name === 'baseUrl');
		expect(baseUrlProperty).toBeDefined();
		expect(baseUrlProperty?.type).toBe('string');
		expect(baseUrlProperty?.required).toBe(true);
	});
});
