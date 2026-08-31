import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { cartApi } from '../api';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  totalItems: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number | string) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number | string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const res = await cartApi.getCart();
      setCart(res.data);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity: number | string) => {
    try {
      const res = await cartApi.addItem(productId, quantity);
      await refreshCart();
      return { success: true, message: res.data.message };
    } catch (err: any) {
      await refreshCart();
      const msg = err.response?.data?.errors?.non_field_errors?.[0]
        || err.response?.data?.message
        || err.response?.data?.detail
        || 'Could not add item to cart.';
      throw new Error(msg);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number | string) => {
    await cartApi.updateItem(itemId, quantity);
    await refreshCart();
  };

  const removeFromCart = async (itemId: string) => {
    await cartApi.removeItem(itemId);
    await refreshCart();
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    await refreshCart();
  };

  const totalItems = cart ? Math.round(cart.total_items) : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        totalItems,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

