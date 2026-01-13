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

export function addToCart(product: Omit<CartItem, 'quantity'>) {
  const itemKey = `${product.id}-${product.size}`;
  const currentItems = cartItems.get();
  
  if (currentItems[itemKey]) {
    cartItems.setKey(itemKey, {
      ...currentItems[itemKey],
      quantity: currentItems[itemKey].quantity + 1,
    });
  } else {
    cartItems.setKey(itemKey, {
      ...product,
      quantity: 1,
    });
  }
  
  isCartOpen.set(true);
}

export function removeFromCart(itemKey: string) {
  const currentItems = { ...cartItems.get() };
  delete currentItems[itemKey];
  cartItems.set(currentItems);
}

export function updateQuantity(itemKey: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(itemKey);
    return;
  }
  
  const currentItems = cartItems.get();
  if (currentItems[itemKey]) {
    cartItems.setKey(itemKey, {
      ...currentItems[itemKey],
      quantity,
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
