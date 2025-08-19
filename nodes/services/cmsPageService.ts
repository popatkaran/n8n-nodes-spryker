import { INodeExecutionData } from 'n8n-workflow';
import { SprykerExecutionContext, SprykerApiResponse, QueryParams } from '../types';
import { SprykerRequestBuilder, createSprykerRequest, executeSprykerRequest } from '../utils/request';

export class CmsPageService {
	private context: SprykerExecutionContext;
	private itemIndex: number;

	constructor(context: SprykerExecutionContext, itemIndex: number) {
		this.context = context;
		this.itemIndex = itemIndex;
	}

	private getRequestParameters() {
		const baseUrl = this.context.getNodeParameter('baseUrl', this.itemIndex) as string;
		const additionalFields = this.context.getNodeParameter('additionalFields', this.itemIndex) as QueryParams;

		return { baseUrl, additionalFields };
	}

	private transformCmsPageResponse(data: any[] | any, fieldsToExtract?: string): INodeExecutionData[] {
		// Handle array of CMS pages (getAll operation)
		if (Array.isArray(data)) {
			return data.map((cmsPage: any) => this.transformSingleCmsPage(cmsPage, fieldsToExtract));
		}

		// Handle single CMS page (get operation)
		return [this.transformSingleCmsPage(data, fieldsToExtract)];
	}

	private transformSingleCmsPage(cmsPage: any, fieldsToExtract?: string): INodeExecutionData {
		const transformedPage: any = {
			id: cmsPage.id,
			type: cmsPage.type,
			...cmsPage.attributes,
			links: cmsPage.links,
			_raw: cmsPage,
		};

		if (fieldsToExtract) {
			const fields = fieldsToExtract.split(',').map(f => f.trim());
			const extractedFields: any = {};
			for (const field of fields) {
				if (transformedPage.hasOwnProperty(field)) {
					extractedFields[field] = transformedPage[field];
				}
			}
			return { json: extractedFields };
		}

		return {
			json: transformedPage,
		};
	}

	async getMany(): Promise<INodeExecutionData[]> {
		const { baseUrl, additionalFields } = this.getRequestParameters();

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint('cms-pages')
				.addInclude(additionalFields.include)
				.addPagination(additionalFields.pageSize, additionalFields.pageNumber)
				.build();
			const options = await createSprykerRequest(this.context, url, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint('cms-pages')
			.addInclude(additionalFields.include)
			.addPagination(additionalFields.pageSize, additionalFields.pageNumber)
			.build();

		const options = await createSprykerRequest(this.context, url, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformCmsPageResponse(response.data, additionalFields.fieldsToExtract);
		}

		// Fallback: return the raw response if structure is unexpected
		// @ts-ignore
		return [{ json: { ...response } }];
	}

	async getById(): Promise<INodeExecutionData[]> {
		const { baseUrl, additionalFields } = this.getRequestParameters();
		const cmsPageId = this.context.getNodeParameter('cmsPageId', this.itemIndex) as string;

		if (additionalFields.rawResponse) {
			const url = new SprykerRequestBuilder(baseUrl)
				.setEndpoint(`cms-pages/${encodeURIComponent(cmsPageId)}`)
				.addInclude(additionalFields.include)
				.build();
			const options = await createSprykerRequest(this.context, url, this.itemIndex);
			const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);
			return [{ json: response }];
		}

		const url = new SprykerRequestBuilder(baseUrl)
			.setEndpoint(`cms-pages/${encodeURIComponent(cmsPageId)}`)
			.addInclude(additionalFields.include)
			.build();

		const options = await createSprykerRequest(this.context, url, this.itemIndex);
		const response: SprykerApiResponse = await executeSprykerRequest(this.context, options, this.itemIndex);

		if (response && response.data) {
			return this.transformCmsPageResponse(response.data, additionalFields.fieldsToExtract);
		}

		// Fallback: return the raw response if structure is unexpected
		// @ts-ignore
		return [{ json: { ...response } }];
	}
}
