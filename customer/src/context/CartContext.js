import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : { items: [], restaurantId: null, restaurantName: '', restaurantDeliveryFee: 0 };
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (food, restaurant) => {
    if (cart.restaurantId && cart.restaurantId !== restaurant._id) {
      if (!window.confirm(`Your cart contains items from ${cart.restaurantName}. Clear cart and add from ${restaurant.name}?`)) {
        return;
      }
      setCart({ items: [], restaurantId: null, restaurantName: '', restaurantDeliveryFee: 0 });
    }

    setCart((prev) => {
      const existing = prev.items.find((item) => item.foodId === food._id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.foodId === food._id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        restaurantDeliveryFee: restaurant.deliveryFee || 0,
        items: [
          ...prev.items,
          {
            foodId: food._id,
            name: food.name,
            price: food.discountPrice || food.price,
            image: food.image,
            quantity: 1,
          },
        ],
      };
    });
  };

  const updateQuantity = (foodId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.foodId === foodId ? { ...item, quantity } : item)),
    }));
  };

  const removeFromCart = (foodId) => {
    setCart((prev) => {
      const items = prev.items.filter((item) => item.foodId !== foodId);
      if (items.length === 0) {
        return { items: [], restaurantId: null, restaurantName: '', restaurantDeliveryFee: 0 };
      }
      return { ...prev, items };
    });
  };

  const clearCart = () => {
    setCart({ items: [], restaurantId: null, restaurantName: '', restaurantDeliveryFee: 0 });
  };

  const getTotal = () => {
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
