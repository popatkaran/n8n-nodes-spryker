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
}
