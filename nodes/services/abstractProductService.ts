import { INodeExecutionData } from 'n8n-workflow';
import { SprykerExecutionContext, SprykerApiResponse, QueryParams } from '../types';
import { SprykerRequestBuilder, createSprykerRequest, executeSprykerRequest } from '../utils/request';

export class AbstractProductService {
	private context: SprykerExecutionContext;
	private itemIndex: number;

	constructor(context: SprykerExecutionContext, itemIndex: number) {
		this.context = context;
		this.itemIndex = itemIndex;
	}

	private getRequestParameters() {
		const baseUrl = this.context.getNodeParameter('baseUrl', this.itemIndex) as string;
		const authentication = this.context.getNodeParameter('authentication', this.itemIndex) as string;
		const additionalFields = this.context.getNodeParameter('additionalFields', this.itemIndex) as QueryParams;

		return { baseUrl, authentication, additionalFields };
	}

	private transformAbstractProductResponse(data: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedProduct: any = {
			id: data.id,
			type: data.type,
			sku: data.attributes?.sku,
			name: data.attributes?.name,
			description: data.attributes?.description,
			averageRating: data.attributes?.averageRating,
			reviewCount: data.attributes?.reviewCount,
			attributes: data.attributes?.attributes,
			superAttributes: data.attributes?.superAttributes,
			superAttributesDefinition: data.attributes?.superAttributesDefinition,
			attributeMap: data.attributes?.attributeMap,
			metaTitle: data.attributes?.metaTitle,
			metaKeywords: data.attributes?.metaKeywords,
			metaDescription: data.attributes?.metaDescription,
			attributeNames: data.attributes?.attributeNames,
			url: data.attributes?.url,
			links: data.links,
			_raw: data,
		};

		// Remove undefined values
		Object.keys(transformedProduct).forEach(key => {
			if (transformedProduct[key] === undefined) {
				delete transformedProduct[key];
			}
		});

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedProduct.hasOwnProperty(field)) {
					extractedFields[field] = transformedProduct[field];
				}
			}
			return { json: extractedFields };
		}

		return {
			json: transformedProduct,
		};
	}

	async getById(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return [this.transformAbstractProductResponse(response.data, additionalFields.fieldsToExtract)];
		}

		// Fallback: return the raw response if structure is unexpected
		return [{ json: { ...response } }];
	}

	async getPrices(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/abstract-product-prices`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/abstract-product-prices`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformPricesResponse(response.data, additionalFields.fieldsToExtract);
		}

		return [{ json: { ...response } }];
	}

	async getAvailabilities(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/abstract-product-availabilities`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/abstract-product-availabilities`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformAvailabilitiesResponse(response.data, additionalFields.fieldsToExtract);
		}

		return [{ json: { ...response } }];
	}

	async getRelatedProducts(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/related-products`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/related-products`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformRelatedProductsResponse(response.data, additionalFields.fieldsToExtract);
		}

		return [{ json: { ...response } }];
	}

	async getImages(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/abstract-product-image-sets`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/abstract-product-image-sets`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformImagesResponse(response.data, additionalFields.fieldsToExtract);
		}

		return [{ json: { ...response } }];
	}

	async getTaxSets(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-tax-sets`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-tax-sets`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformTaxSetsResponse(response.data, additionalFields.fieldsToExtract);
		}

		return [{ json: { ...response } }];
	}

	async getReviews(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-reviews`)
				.addInclude(additionalFields.include)
				.addPagination(additionalFields.pageSize, additionalFields.pageNumber)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-reviews`)
			.addInclude(additionalFields.include)
			.addPagination(additionalFields.pageSize, additionalFields.pageNumber)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformReviewsResponse(response.data, additionalFields.fieldsToExtract);
		}

		return [{ json: { ...response } }];
	}

	async getReview(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;
		const productReviewId = this.context.getNodeParameter('productReviewId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-reviews/${encodeURIComponent(productReviewId)}`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-reviews/${encodeURIComponent(productReviewId)}`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return [this.transformSingleReviewResponse(response.data, additionalFields.fieldsToExtract)];
		}

		return [{ json: { ...response } }];
	}

	async createReview(): Promise<INodeExecutionData[]> {
		const { baseUrl, authentication, additionalFields } = this.getRequestParameters();
		const abstractProductId = this.context.getNodeParameter('abstractProductId', this.itemIndex) as string;
		const rating = this.context.getNodeParameter('rating', this.itemIndex) as number;
		const nickname = this.context.getNodeParameter('nickname', this.itemIndex) as string;
		const summary = this.context.getNodeParameter('summary', this.itemIndex) as string;
		const description = this.context.getNodeParameter('description', this.itemIndex) as string;

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`abstract-products/${encodeURIComponent(abstractProductId)}/product-reviews`)
			.build();

		const requestBody = {
			data: {
				type: 'product-reviews',
				attributes: {
					rating,
					nickname,
					summary,
					description,
				},
			},
		};

		const options = await createSprykerRequest(this.context, url, authentication, this.itemIndex, 'POST', requestBody);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (additionalFields.rawResponse) {
			return [{ json: response }];
		}

		if (response && response.data) {
			return [this.transformSingleReviewResponse(response.data, additionalFields.fieldsToExtract)];
		}

		return [{ json: { ...response } }];
	}

	// Transform methods for different response types
	private transformPricesResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		if (Array.isArray(data)) {
			return data.map((price: any) => this.transformSinglePriceResponse(price, fieldsToExtract));
		}
		return [this.transformSinglePriceResponse(data, fieldsToExtract)];
	}

	private transformSinglePriceResponse(price: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedPrice: any = {
			id: price.id,
			type: price.type,
			price: price.attributes?.price,
			prices: price.attributes?.prices,
			links: price.links,
			_raw: price,
		};

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedPrice.hasOwnProperty(field)) {
					extractedFields[field] = transformedPrice[field];
				}
			}
			return { json: extractedFields };
		}

		return { json: transformedPrice };
	}

	private transformAvailabilitiesResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		if (Array.isArray(data)) {
			return data.map((availability: any) => this.transformSingleAvailabilityResponse(availability, fieldsToExtract));
		}
		return [this.transformSingleAvailabilityResponse(data, fieldsToExtract)];
	}

	private transformSingleAvailabilityResponse(availability: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedAvailability: any = {
			id: availability.id,
			type: availability.type,
			availability: availability.attributes?.availability,
			quantity: availability.attributes?.quantity,
			links: availability.links,
			_raw: availability,
		};

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedAvailability.hasOwnProperty(field)) {
					extractedFields[field] = transformedAvailability[field];
				}
			}
			return { json: extractedFields };
		}

		return { json: transformedAvailability };
	}

	private transformRelatedProductsResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		if (Array.isArray(data)) {
			return data.map((product: any) => this.transformAbstractProductResponse(product, fieldsToExtract));
		}
		return [this.transformAbstractProductResponse(data, fieldsToExtract)];
	}

	private transformImagesResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		if (Array.isArray(data)) {
			return data.map((imageSet: any) => this.transformSingleImageSetResponse(imageSet, fieldsToExtract));
		}
		return [this.transformSingleImageSetResponse(data, fieldsToExtract)];
	}

	private transformSingleImageSetResponse(imageSet: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedImageSet: any = {
			id: imageSet.id,
			type: imageSet.type,
			imageSets: imageSet.attributes?.imageSets,
			links: imageSet.links,
			_raw: imageSet,
		};

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedImageSet.hasOwnProperty(field)) {
					extractedFields[field] = transformedImageSet[field];
				}
			}
			return { json: extractedFields };
		}

		return { json: transformedImageSet };
	}

	private transformTaxSetsResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		if (Array.isArray(data)) {
			return data.map((taxSet: any) => this.transformSingleTaxSetResponse(taxSet, fieldsToExtract));
		}
		return [this.transformSingleTaxSetResponse(data, fieldsToExtract)];
	}

	private transformSingleTaxSetResponse(taxSet: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedTaxSet: any = {
			id: taxSet.id,
			type: taxSet.type,
			name: taxSet.attributes?.name,
			restTaxRates: taxSet.attributes?.restTaxRates,
			links: taxSet.links,
			_raw: taxSet,
		};

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedTaxSet.hasOwnProperty(field)) {
					extractedFields[field] = transformedTaxSet[field];
				}
			}
			return { json: extractedFields };
		}

		return { json: transformedTaxSet };
	}

	private transformReviewsResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		if (Array.isArray(data)) {
			return data.map((review: any) => this.transformSingleReviewResponse(review, fieldsToExtract));
		}
		return [this.transformSingleReviewResponse(data, fieldsToExtract)];
	}

	private transformSingleReviewResponse(review: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedReview: any = {
			id: review.id,
			type: review.type,
			rating: review.attributes?.rating,
			nickname: review.attributes?.nickname,
			summary: review.attributes?.summary,
			description: review.attributes?.description,
			links: review.links,
			_raw: review,
		};

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedReview.hasOwnProperty(field)) {
					extractedFields[field] = transformedReview[field];
				}
			}
			return { json: extractedFields };
		}

		return { json: transformedReview };
	}
}
