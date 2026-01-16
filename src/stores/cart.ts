import { atom, map, computed } from 'nanostores';
import { persistentMap } from '@nanostores/persistent';

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  maxStock: number;
}

export const cartItems = persistentMap<Record<string, CartItem>>('cart:', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const isCartOpen = atom(false);

export const cartCount = computed(cartItems, (items) => {
  return Object.values(items).reduce((total, item) => total + item.quantity, 0);
});

export const cartTotal = computed(cartItems, (items) => {
  return Object.values(items).reduce((total, item) => total + (item.price * item.quantity), 0);
});

export function addToCart(product: Omit<CartItem, 'quantity' | 'maxStock'>, maxStock: number) {
  const itemKey = `${product.id}-${product.size}`;
  const currentItems = cartItems.get();

  if (currentItems[itemKey]) {
    const newQuantity = currentItems[itemKey].quantity + 1;
    // Limit to maxStock
    if (newQuantity <= maxStock) {
      cartItems.setKey(itemKey, {
        ...currentItems[itemKey],
        quantity: newQuantity,
        maxStock: maxStock // Ensure it's updated/synced
      });
    } else {
      // Keep at maxStock if already reached
      cartItems.setKey(itemKey, {
        ...currentItems[itemKey],
        quantity: maxStock,
        maxStock: maxStock
      });
    }
  } else {
    cartItems.setKey(itemKey, {
      ...product,
      quantity: 1,
      maxStock: maxStock
    });
  }

  isCartOpen.set(true);
}

export function removeFromCart(itemKey: string) {
  const currentItems = { ...cartItems.get() };
  delete currentItems[itemKey];
  cartItems.set(currentItems);
}

export function updateQuantity(itemKey: string, quantity: number, maxStock: number) {
  if (quantity <= 0) {
    removeFromCart(itemKey);
    return;
  }

  // Enforce maxStock limit
  const finalQuantity = Math.min(quantity, maxStock);

  const currentItems = cartItems.get();
  if (currentItems[itemKey]) {
    cartItems.setKey(itemKey, {
      ...currentItems[itemKey],
      quantity: finalQuantity,
    });
  }
}

export function clearCart() {
  cartItems.set({});
}

export function toggleCart() {
  isCartOpen.set(!isCartOpen.get());
}

export function openCart() {
  isCartOpen.set(true);
}

export function closeCart() {
  isCartOpen.set(false);
}
