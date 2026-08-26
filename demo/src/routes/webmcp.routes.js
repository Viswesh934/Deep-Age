import { Hono } from 'hono';
import { getAddToCartCapability } from '../data/products.js';
export const webmcpRouter = new Hono();
webmcpRouter.get('/tools', (c) => {
    const isAddToCartEnabled = getAddToCartCapability();
    const tools = [
        {
            name: 'search_products',
            description: 'Search for catalog items by keyword and category',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    max_price: { type: 'number' },
                },
            },
        },
        {
            name: 'filter_products',
            description: 'Filter laptops by minimum RAM and maximum price',
            inputSchema: {
                type: 'object',
                properties: {
                    ram_gb: { type: 'number' },
                    max_price: { type: 'number' },
                },
            },
        },
        {
            name: 'get_product_details',
            description: 'Fetch detailed specifications and stock for a product ID',
            inputSchema: {
                type: 'object',
                properties: {
                    product_id: { type: 'string' },
                },
                required: ['product_id'],
            },
        },
    ];
    if (isAddToCartEnabled) {
        tools.push({
            name: 'add_to_cart',
            description: 'Add a specified product item to the user shopping cart',
            inputSchema: {
                type: 'object',
                properties: {
                    product_id: { type: 'string' },
                    quantity: { type: 'number' },
                },
                required: ['product_id'],
            },
        });
    }
    return c.json({ tools, enableAddToCartCapability: isAddToCartEnabled });
});
