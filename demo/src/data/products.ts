export interface Product {
  id: string;
  name: string;
  price: number;
  ram: number;
  category: string;
  inStock: boolean;
}

export const PRODUCTS: Product[] = [
  { id: 'lap-901', name: 'UltraBook Pro 14', price: 74999, ram: 16, category: 'laptop', inStock: true },
  { id: 'lap-902', name: 'GamerMax 15', price: 85000, ram: 16, category: 'laptop', inStock: true },
  { id: 'lap-903', name: 'AirBook Slim', price: 62000, ram: 8, category: 'laptop', inStock: true },
  { id: 'lap-904', name: 'DevStudio 16', price: 120000, ram: 32, category: 'laptop', inStock: true },
];

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

export const cartItems: CartItem[] = [];

let enableAddToCartCapability = false;

export function setAddToCartCapability(enabled: boolean) {
  enableAddToCartCapability = enabled;
}

export function getAddToCartCapability(): boolean {
  return enableAddToCartCapability;
}
