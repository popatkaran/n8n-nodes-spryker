export interface SprykerCredentials {
	accessToken?: string;
}

export interface CmsPageAttributes {
	id: string;
	type: string;
	attributes: any;
	links: any;
	_raw: any;
}

export interface SprykerApiResponse {
	data: any[] | any;
	links?: any;
	included?: any[];
	meta?: any;
	[key: string]: any;
}

export interface QueryParams {
	include?: string;
	pageSize?: number;
	pageNumber?: number;
	fieldsToExtract?: string;
	rawResponse?: boolean;
	[key: string]: any;
}

export interface SprykerRequestOptions {
	baseUrl: string;
	authentication: string;
	additionalFields: QueryParams;
}

export type SprykerResource = 'cmsPages';
export type SprykerOperation = 'getAll' | 'get';

export interface SprykerExecutionContext {
	getNodeParameter: (name: string, itemIndex: number) => any;
	getCredentials: (name: string) => Promise<SprykerCredentials>;
	helpers: {
		request: (options: any) => Promise<any>;
	};
	getNode: () => any;
}
