import { Hono } from 'hono';
import {
  getAddToCartCapability,
  getPromoCodeCapability,
  getSchemaCorruption,
  PRODUCTS,
} from '../data/products.js';

export const webmcpRouter = new Hono();

webmcpRouter.get('/tools', (c) => {
  const isAddToCartEnabled = getAddToCartCapability();
  const isPromoEnabled = getPromoCodeCapability();
  const isCorrupted = getSchemaCorruption();

  const tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    safetyTier?: string;
  }> = [
    {
      name: 'search_products',
      description: 'Search catalog products and specifications by query keyword or category',
      safetyTier: 'public_read',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Product search term, model name, or tag' },
          category: { type: 'string', description: 'Optional category (laptop, workstation, accessory, monitor)' },
          max_price: { type: 'number', description: 'Maximum price filter in INR' },
        },
      },
    },
    {
      name: 'filter_products',
      description: 'Filter laptops and hardware by minimum RAM, maximum price, and category',
      safetyTier: 'public_read',
      inputSchema: isCorrupted
        ? {
            type: 'corrupted_schema_type_error',
            properties: { ram_gb: { type: 'non_existent_primitive' } },
          }
        : {
            type: 'object',
            properties: {
              ram_gb: { type: 'number', description: 'Minimum RAM in gigabytes (e.g. 16, 32)' },
              max_price: { type: 'number', description: 'Maximum budget limit in INR' },
              category: { type: 'string', description: 'Product category' },
            },
          },
    },
    {
      name: 'get_product_details',
      description: 'Fetch detailed hardware specifications, benchmarks, and stock inventory for a product ID',
      safetyTier: 'public_read',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID e.g. lap-901' },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'get_product_reviews',
      description: 'Fetch verified customer reviews, ratings, and feedback for a product ID',
      safetyTier: 'public_read',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID e.g. lap-901' },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'view_cart',
      description: 'Inspect currently added cart items, quantities, applied discounts, taxes, and subtotal',
      safetyTier: 'context_read',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  if (isAddToCartEnabled) {
    tools.push({
      name: 'add_to_cart',
      description: 'Add a specified product item to the user shopping cart',
      safetyTier: 'reversible_write',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Target product ID to add (e.g. lap-901)' },
          quantity: { type: 'number', description: 'Quantity of units to add (default 1)' },
        },
        required: ['product_id'],
      },
    });
  }

  if (isPromoEnabled) {
    tools.push({
      name: 'apply_promo_code',
      description: 'Apply a promotional coupon code (e.g. SAVE10, DEEPAGE50) to the active shopping cart',
      safetyTier: 'reversible_write',
      inputSchema: {
        type: 'object',
        properties: {
          promo_code: { type: 'string', description: 'Coupon voucher code e.g. SAVE10' },
        },
        required: ['promo_code'],
      },
    });

    tools.push({
      name: 'remove_promo_code',
      description: 'Remove applied promotional coupon (Saga Compensation rollback)',
      safetyTier: 'reversible_write',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });
  }

  tools.push({
    name: 'complete_checkout',
    description: 'Authorize payment and generate confirmed shipping order',
    safetyTier: 'critical_destructive',
    inputSchema: {
      type: 'object',
      properties: {
        shipping_address: { type: 'string', description: 'Delivery street and city address' },
        payment_method: { type: 'string', description: 'Payment method: card, upi, or passkey' },
      },
      required: ['shipping_address'],
    },
  });

  return c.json({
    tools,
    enableAddToCartCapability: isAddToCartEnabled,
    enablePromoCodeCapability: isPromoEnabled,
    isCorruptedSchema: isCorrupted,
  });
});

