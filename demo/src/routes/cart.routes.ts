import { Hono } from 'hono';
import { PRODUCTS, cartItems, activePromo, AppliedPromo } from '../data/products.js';

export const cartRouter = new Hono();

function calculateCartTotals() {
  const detailedItems = cartItems.map((item) => {
    const prod = PRODUCTS.find((p) => p.id === item.productId);
    const unitPrice = prod ? prod.price : item.unitPrice || 0;
    const name = prod ? prod.name : item.productName || item.productId;
    return {
      ...item,
      productName: name,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  });

  const subtotal = detailedItems.reduce((acc, it) => acc + it.totalPrice, 0);
  let discount = 0;
  if (activePromo) {
    if (activePromo.discountPercent) {
      discount = Math.round(subtotal * (activePromo.discountPercent / 100));
    } else if (activePromo.discountFixed) {
      discount = Math.min(subtotal, activePromo.discountFixed);
    }
  }

  const tax = Math.round((subtotal - discount) * 0.18); // 18% GST/VAT
  const finalTotal = Math.max(0, subtotal - discount + tax);

  return {
    items: detailedItems,
    count: detailedItems.reduce((acc, it) => acc + it.quantity, 0),
    subtotal,
    discount,
    activePromo,
    tax,
    finalTotal,
  };
}

cartRouter.get('/', (c) => {
  const totals = calculateCartTotals();
  return c.json({
    cartCount: totals.count,
    ...totals,
  });
});

cartRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const productId = body.productId || body.product_id;
  const quantity = Number(body.quantity) || 1;

  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return c.json({ error: 'Product not found', productId }, 404);
  }

  const existing = cartItems.find((it) => it.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cartItems.push({
      productId,
      quantity,
      addedAt: Date.now(),
      unitPrice: product.price,
      productName: product.name,
    });
  }

  const totals = calculateCartTotals();
  return c.json({
    success: true,
    message: `Added ${product.name} to cart (Qty: ${quantity})`,
    cartCount: totals.count,
    cart: totals,
  });
});

cartRouter.patch('/:id', async (c) => {
  const productId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const quantity = Number(body.quantity);

  const idx = cartItems.findIndex((it) => it.productId === productId);
  if (idx === -1) {
    return c.json({ error: 'Item not in cart' }, 404);
  }

  if (quantity <= 0) {
    cartItems.splice(idx, 1);
  } else {
    cartItems[idx].quantity = quantity;
  }

  const totals = calculateCartTotals();
  return c.json({ success: true, cart: totals });
});

cartRouter.delete('/:id', (c) => {
  const productId = c.req.param('id');
  const idx = cartItems.findIndex((it) => it.productId === productId);
  if (idx !== -1) {
    cartItems.splice(idx, 1);
  }
  const totals = calculateCartTotals();
  return c.json({ success: true, message: 'Item removed from cart', cart: totals });
});

cartRouter.post('/promo', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const code = (body.code || body.promo_code || '').toUpperCase().trim();

  const VALID_PROMOS: Record<string, AppliedPromo> = {
    SAVE10: { code: 'SAVE10', discountPercent: 10, description: '10% Instant Creator Discount' },
    DEEPAGE50: { code: 'DEEPAGE50', discountFixed: 5000, description: '₹5,000 WebMCP Early Adopter Voucher' },
    DEVSTUDIO100: { code: 'DEVSTUDIO100', discountFixed: 10000, description: '₹10,000 ML Dev Studio Credit' },
  };

  if (!VALID_PROMOS[code]) {
    return c.json({ error: `Invalid or expired promo code "${code}". Try SAVE10 or DEEPAGE50.` }, 400);
  }

  (globalThis as any).activeDemoPromo = VALID_PROMOS[code];
  const totals = calculateCartTotals();
  return c.json({
    success: true,
    message: `Promo code ${code} applied successfully!`,
    promo: VALID_PROMOS[code],
    cart: totals,
  });
});

cartRouter.delete('/promo', (c) => {
  (globalThis as any).activeDemoPromo = null;
  const totals = calculateCartTotals();
  return c.json({ success: true, message: 'Promo code removed (Saga compensation triggered)', cart: totals });
});

cartRouter.post('/checkout', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (cartItems.length === 0) {
    return c.json({ error: 'Cart is empty' }, 400);
  }

  const totals = calculateCartTotals();
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Clear cart on successful order
  cartItems.length = 0;
  (globalThis as any).activeDemoPromo = null;

  return c.json({
    success: true,
    orderId,
    status: 'CONFIRMED',
    totalPaid: totals.finalTotal,
    itemsPurchased: totals.items,
    trackingNumber: `TRK-IN-${Math.floor(100000 + Math.random() * 900000)}`,
    estimatedDelivery: '2 business days (Express Courier)',
    message: 'Order successfully placed via WebMCP transactional gateway.',
  });
});

