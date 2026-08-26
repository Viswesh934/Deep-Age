import { Hono } from 'hono';
import { PRODUCTS } from '../data/products.js';
export const productsRouter = new Hono();
productsRouter.get('/', (c) => {
    const query = c.req.query('query')?.toLowerCase();
    const maxPrice = Number(c.req.query('maxPrice')) || Infinity;
    const ram = Number(c.req.query('ram'));
    let filtered = PRODUCTS.filter((p) => p.price <= maxPrice);
    if (ram)
        filtered = filtered.filter((p) => p.ram >= ram);
    if (query) {
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    }
    return c.json({ products: filtered });
});
productsRouter.get('/:id', (c) => {
    const id = c.req.param('id');
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product)
        return c.json({ error: 'Product not found' }, 404);
    return c.json({ product });
});
