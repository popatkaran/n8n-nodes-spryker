export interface SprykerCredentials {
	username: string;
	password: string;
	baseUrl: string;
}

export interface SprykerTokenResponse {
	data: {
		type: string;
		id: string | null;
		attributes: {
			tokenType: string;
			expiresIn: number;
			accessToken: string;
			refreshToken: string;
		};
		links: {
			self: string;
		};
	};
}

export interface SprykerTokenCache {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

export interface CmsPageAttributes {
	id: string;
	type: string;
	attributes: any;
	links: any;
	_raw: any;
}

export interface AbstractProductAttributes {
	id: string;
	type: string;
	sku: string;
	name: string;
	description: string;
	averageRating: number | null;
	reviewCount: number;
	attributes: Record<string, any>;
	superAttributes: any[];
	superAttributesDefinition: string[];
	attributeMap: {
		super_attributes: any[];
		product_concrete_ids: string[];
		attribute_variants: any[];
		attribute_variant_map: any[];
	};
	metaTitle: string;
	metaKeywords: string;
	metaDescription: string;
	attributeNames: Record<string, string>;
	url: string;
	links: any;
	_raw: any;
}

export interface PriceAttributes {
	id: string;
	type: string;
	price: number;
	prices: Array<{
		priceTypeName: string;
		netAmount: number | null;
		grossAmount: number;
		currency: {
			code: string;
			name: string;
			symbol: string;
		};
		volumePrices: Array<{
			netAmount: number;
			grossAmount: number;
			quantity: number;
		}>;
	}>;
	links: any;
	_raw: any;
}

export interface AvailabilityAttributes {
	id: string;
	type: string;
	availability: boolean;
	quantity: string;
	links: any;
	_raw: any;
}

export interface ImageSetAttributes {
	id: string;
	type: string;
	imageSets: Array<{
		name: string;
		images: Array<{
			externalUrlLarge: string;
			externalUrlSmall: string;
		}>;
	}>;
	links: any;
	_raw: any;
}

export interface TaxSetAttributes {
	id: string;
	type: string;
	name: string;
	restTaxRates: Array<{
		name: string;
		rate: string;
		country: string;
	}>;
	links: any;
	_raw: any;
}

export interface ReviewAttributes {
	id: string;
	type: string;
	rating: number;
	nickname: string;
	summary: string;
	description: string;
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

export type SprykerResource = 'cmsPages' | 'abstractProducts';
export type SprykerOperation = 'getAll' | 'get' | 'getPrices' | 'getAvailabilities' | 'getRelatedProducts' | 'getImages' | 'getTaxSets' | 'getReviews' | 'getReview' | 'createReview';

export interface SprykerExecutionContext {
	getNodeParameter: (name: string, itemIndex: number) => any;
	getCredentials: (name: string) => Promise<SprykerCredentials>;
	helpers: {
		request: (options: any) => Promise<any>;
	};
	getNode: () => any;
}
