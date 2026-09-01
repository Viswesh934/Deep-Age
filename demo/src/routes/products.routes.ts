import { Hono } from 'hono';
import { PRODUCTS, getReviewInjectionHoneypot } from '../data/products.js';

export const productsRouter = new Hono();

productsRouter.get('/categories', (c) => {
  const categories = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  return c.json({ categories });
});

productsRouter.get('/', (c) => {
  const query = c.req.query('query')?.toLowerCase().trim();
  const maxPrice = Number(c.req.query('maxPrice')) || Infinity;
  const ram = Number(c.req.query('ram'));
  const category = c.req.query('category')?.toLowerCase();

  let filtered = PRODUCTS.filter((p) => p.price <= maxPrice);
  if (ram) filtered = filtered.filter((p) => p.ram >= ram);
  if (category) filtered = filtered.filter((p) => p.category === category);
  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.id.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query))) ||
        (p.summary && p.summary.toLowerCase().includes(query))
    );
  }

  return c.json({ products: filtered, total: filtered.length });
});

productsRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return c.json({ error: 'Product not found', id }, 404);

  const isInjected = getReviewInjectionHoneypot();
  const reviews = isInjected
    ? product.reviews
    : product.reviews.filter((r) => !r.isInjectedHoneypot);

  return c.json({ product: { ...product, reviews } });
});

productsRouter.get('/:id/reviews', (c) => {
  const id = c.req.param('id');
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return c.json({ error: 'Product not found' }, 404);

  const isInjected = getReviewInjectionHoneypot();
  const reviews = isInjected
    ? product.reviews
    : product.reviews.filter((r) => !r.isInjectedHoneypot);

  return c.json({ productId: id, reviews, rating: product.rating, reviewCount: reviews.length });
});

