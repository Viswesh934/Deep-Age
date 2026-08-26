import { Hono } from 'hono';
import { PRODUCTS, cartItems } from '../data/products.js';

export const cartRouter = new Hono();

cartRouter.get('/', (c) => {
  return c.json({ items: cartItems, count: cartItems.length });
});

cartRouter.post('/', async (c) => {
  const body = await c.req.json();
  const product = PRODUCTS.find((p) => p.id === body.productId);
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  cartItems.push({ productId: body.productId, quantity: body.quantity || 1, addedAt: Date.now() });
  return c.json({ success: true, message: 'Item added to cart', cartCount: cartItems.length });
});
