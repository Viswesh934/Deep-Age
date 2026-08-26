import { Hono } from 'hono';
import { PRODUCTS, getAddToCartCapability } from '../data/products.js';
export const storefrontRouter = new Hono();
storefrontRouter.get('/', (c) => {
    const isAddToCartEnabled = getAddToCartCapability();
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ElectroVault — Deep Age Demo Store</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto">
    <header class="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-zinc-100 font-mono">⚡ ElectroVault Storefront</h1>
        <p class="text-xs text-zinc-400">Target site conforming to Chrome WebMCP (document.modelContext)</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-700 font-mono">
          WebMCP add_to_cart: <strong id="status-tag" class="${isAddToCartEnabled ? 'text-emerald-400' : 'text-amber-400'}">${isAddToCartEnabled ? 'EXPOSED' : 'MISSING (Friction)'}</strong>
        </span>
        <button onclick="toggleCapability()" class="text-xs bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-3 py-1.5 transition-colors font-mono">Toggle Capability</button>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      ${PRODUCTS.map(p => `
        <div class="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-base text-zinc-100">${p.name}</h3>
            <p class="text-xs text-zinc-400 font-mono mt-0.5">${p.ram}GB RAM • In Stock</p>
            <p class="text-lg font-bold text-emerald-400 mt-2 font-mono">₹${p.price.toLocaleString()}</p>
          </div>
          <button data-product-id="${p.id}" class="btn-add-to-cart mt-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono py-2 transition-colors">
            Add to Cart (DOM button)
          </button>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    // Chrome WebMCP Standard implementation
    window.modelContext = window.modelContext || {
      tools: [],
      registerTool(tool) {
        this.tools = this.tools.filter(t => t.name !== tool.name);
        this.tools.push(tool);
      }
    };

    try {
      if (!document.modelContext) {
        document.modelContext = window.modelContext;
      }
    } catch (e) {}

    // 1. Search Products Tool (Chrome WebMCP Standard)
    window.modelContext.registerTool({
      name: 'search_products',
      description: 'Search for catalog items by keyword and category',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or product keyword' }
        }
      },
      execute: async (input) => {
        const query = (input && input.query) || '';
        const res = await fetch('/api/products?query=' + encodeURIComponent(query));
        return res.json();
      }
    });

    // 2. Filter Products Tool
    window.modelContext.registerTool({
      name: 'filter_products',
      description: 'Filter laptops by minimum RAM and maximum price',
      inputSchema: {
        type: 'object',
        properties: {
          ram_gb: { type: 'number', description: 'Minimum RAM in gigabytes' },
          max_price: { type: 'number', description: 'Maximum price in INR' }
        }
      },
      execute: async (input) => {
        const ram = (input && input.ram_gb) || '';
        const maxPrice = (input && input.max_price) || '';
        const res = await fetch('/api/products?ram=' + encodeURIComponent(ram) + '&maxPrice=' + encodeURIComponent(maxPrice));
        return res.json();
      }
    });

    // 3. Get Product Details Tool
    window.modelContext.registerTool({
      name: 'get_product_details',
      description: 'Fetch detailed specifications and stock for a product ID',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID e.g. lap-901' }
        },
        required: ['product_id']
      },
      execute: async (input) => {
        const productId = (input && input.product_id) || '';
        const res = await fetch('/api/products?query=' + encodeURIComponent(productId));
        return res.json();
      }
    });

    ${isAddToCartEnabled ? `
    // 4. Add To Cart Tool
    window.modelContext.registerTool({
      name: 'add_to_cart',
      description: 'Add a specified product item to the user shopping cart',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Target product ID to add' },
          quantity: { type: 'number', description: 'Quantity of units (default 1)' }
        },
        required: ['product_id']
      },
      execute: async (input) => {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: input.product_id, quantity: input.quantity || 1 })
        });
        return res.json();
      }
    });
    ` : '// Note: add_to_cart tool is intentionally missing to reproduce agent friction!'}

    async function toggleCapability() {
      await fetch('/api/admin/toggle-add-to-cart', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      window.location.reload();
    }
  </script>
</body>
</html>
  `;
    return c.html(html);
});
