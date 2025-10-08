import { useContext } from 'react';
import { CartContext, CartContextType } from './cart-context';

// Custom hook untuk menggunakan cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Export types untuk digunakan di komponen lain
export type { CartItem, Cart } from './cart-context';
