import { Hono } from 'hono';
import {
  setAddToCartCapability,
  getAddToCartCapability,
  setPromoCodeCapability,
  getPromoCodeCapability,
  setSchemaCorruption,
  getSchemaCorruption,
  setReviewInjectionHoneypot,
  getReviewInjectionHoneypot,
  setPiiLeakHoneypot,
  getPiiLeakHoneypot,
  setBiometricPasskey,
  getBiometricPasskey,
  resetSimulationState,
} from '../data/products.js';

export const adminRouter = new Hono();

adminRouter.get('/status', (c) => {
  return c.json({
    enableAddToCartCapability: getAddToCartCapability(),
    enablePromoCodeCapability: getPromoCodeCapability(),
    enableSchemaCorruption: getSchemaCorruption(),
    enableReviewInjectionHoneypot: getReviewInjectionHoneypot(),
    enablePiiLeakHoneypot: getPiiLeakHoneypot(),
    enableBiometricPasskey: getBiometricPasskey(),
  });
});

adminRouter.post('/toggle-add-to-cart', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setAddToCartCapability(body.enabled);
  } else {
    setAddToCartCapability(!getAddToCartCapability());
  }
  return c.json({ enableAddToCartCapability: getAddToCartCapability() });
});

adminRouter.post('/toggle-promo-code', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setPromoCodeCapability(body.enabled);
  } else {
    setPromoCodeCapability(!getPromoCodeCapability());
  }
  return c.json({ enablePromoCodeCapability: getPromoCodeCapability() });
});

adminRouter.post('/toggle-schema-corruption', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setSchemaCorruption(body.enabled);
  } else {
    setSchemaCorruption(!getSchemaCorruption());
  }
  return c.json({ enableSchemaCorruption: getSchemaCorruption() });
});

adminRouter.post('/toggle-review-injection', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setReviewInjectionHoneypot(body.enabled);
  } else {
    setReviewInjectionHoneypot(!getReviewInjectionHoneypot());
  }
  return c.json({ enableReviewInjectionHoneypot: getReviewInjectionHoneypot() });
});

adminRouter.post('/toggle-pii-leak', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setPiiLeakHoneypot(body.enabled);
  } else {
    setPiiLeakHoneypot(!getPiiLeakHoneypot());
  }
  return c.json({ enablePiiLeakHoneypot: getPiiLeakHoneypot() });
});

adminRouter.post('/toggle-passkey', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    setBiometricPasskey(body.enabled);
  } else {
    setBiometricPasskey(!getBiometricPasskey());
  }
  return c.json({ enableBiometricPasskey: getBiometricPasskey() });
});

adminRouter.post('/reset', (c) => {
  resetSimulationState();
  return c.json({ success: true, message: 'All demo store simulation states reset to default.' });
});

