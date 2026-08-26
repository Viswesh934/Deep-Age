import { Hono } from 'hono';
import { setAddToCartCapability, getAddToCartCapability } from '../data/products.js';

export const adminRouter = new Hono();

adminRouter.post('/toggle-add-to-cart', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setAddToCartCapability(body.enabled);
  } else {
    setAddToCartCapability(!getAddToCartCapability());
  }
  return c.json({ enableAddToCartCapability: getAddToCartCapability() });
});
