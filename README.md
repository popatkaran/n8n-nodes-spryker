# n8n-nodes-spryker

This is an n8n community node. It lets you use Spryker in your n8n workflows.

Spryker is a composable commerce platform for sophisticated transactional business models.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### CMS Pages
- **Get all CMS pages** - Retrieve a list of all CMS pages with pagination support
- **Get a single CMS page by ID** - Retrieve a specific CMS page using its unique identifier

### Abstract Products
- **Get by ID** - Retrieve a specific abstract product by its ID/SKU
- **Get Prices** - Get pricing information for an abstract product including different price types and currencies
- **Get Availabilities** - Check availability and stock quantity for an abstract product
- **Get Related Products** - Retrieve products related to a specific abstract product
- **Get Images** - Get image sets and URLs for an abstract product
- **Get Tax Sets** - Retrieve tax information and rates for an abstract product across different countries
- **Get Reviews** - Get all customer reviews for an abstract product with pagination
- **Get Review** - Retrieve a specific review by product ID and review ID
- **Create Review** - Submit a new customer review for an abstract product

### Features
- **Field Extraction** - Extract only specific fields from API responses
- **Raw Response** - Option to return the complete API response without transformation
- **Pagination** - Support for paginated results where applicable
- **Include Relations** - Include related resources in API responses using Spryker's include parameter
- **Error Handling** - Comprehensive error handling with continue-on-fail support

## Credentials

To use this node, you need to authenticate with the Spryker API. This node supports two authentication methods:

- **Access Token:** You can provide an access token directly.
- **Username & Password:** You can provide your username and password, and the node will automatically fetch an access token for you.

You will also need to provide the Base URL of your Spryker API instance (e.g., `https://glue.eu.spryker.local`).

## Compatibility

This node is compatible with n8n version 1.0.0 and later.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Spryker API documentation](https://docs.spryker.com/docs/scos/dev/glue-api-guides/)