import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [],
  wishlistItems: [],
  totalAmount: 0,
  totalQuantity: 0,
  totalWishlistQuantity: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.cartItems.find(
        (item) => item.id === newItem.id
      );
      state.totalQuantity++;

      if (!existingItem) {
        state.cartItems.push({
          id: newItem.id,
          productName: newItem.productName,
          imgUrl: newItem.imgUrl,
          price: newItem.price,
          quantity: 1,
          totalPrice: newItem.price,
        });
      } else {
        existingItem.quantity++;
        existingItem.totalPrice =
          Number(existingItem.totalPrice) + Number(newItem.price);
      }

      state.totalAmount = state.cartItems.reduce((total, item) => {
        return total + Number(item.price) * Number(item.quantity);
      }, 0);
    },
    deleteItem: (state, action) => {
      const id = action.payload;
      const existingItem = state.cartItems.find((item) => item.id === id);

      if (existingItem) {
        state.cartItems = state.cartItems.filter((item) => item.id !== id);
        state.totalQuantity = Math.max(
          0,
          state.totalQuantity - existingItem.quantity
        );
      }
      state.totalAmount = state.cartItems.reduce((total, item) => {
        return total + Number(item.price) * Number(item.quantity);
      }, 0);
    },
    addToWishlist: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.wishlistItems.find(
        (item) => item.id === newItem.id
      );

      if (!existingItem) {
        state.wishlistItems.push({ ...newItem });
        state.totalWishlistQuantity++;
      }
    },
    removeFromWishlist: (state, action) => {
      const id = action.payload;
      const existingItem = state.wishlistItems.find((item) => item.id === id);

      if (existingItem) {
        state.wishlistItems = state.wishlistItems.filter(
          (item) => item.id !== id
        );
        state.totalWishlistQuantity = Math.max(
          0,
          state.totalWishlistQuantity - 1
        );
      }
    },
    resetCart: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
    },
    resetWishlist: (state) => {
      state.wishlistItems = [];
      state.totalWishlistQuantity = 0;
    },

    setCartItems: (state, action) => {
      state.cartItems = action.payload.cartItems;
      state.totalAmount = state.cartItems.reduce(
        (total, item) => total + item.totalPrice,
        0
      );
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
    },
    setWishlistItems: (state, action) => {
      state.wishlistItems = action.payload.wishlistItems;
      state.totalWishlistQuantity = state.wishlistItems.length;
    },
    incrementItemQuantity: (state, action) => {
      const item = state.cartItems.find((item) => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        item.totalPrice = Number(item.totalPrice) + Number(item.price);
        state.totalQuantity += 1; // Increment the total quantity
      }
      state.totalAmount = state.cartItems.reduce(
        (total, item) => total + item.totalPrice,
        0
      );
    },

    decrementItemQuantity: (state, action) => {
      const item = state.cartItems.find((item) => item.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.totalPrice = Number(item.totalPrice) - Number(item.price);
        state.totalQuantity -= 1; // Decrement the total quantity
      } else if (item && item.quantity === 1) {
        // If you decide to keep items at quantity 1 without removing them, remove this block
        state.cartItems = state.cartItems.filter(
          (item) => item.id !== action.payload
        );
      }
      state.totalAmount = state.cartItems.reduce(
        (total, item) => total + item.totalPrice,
        0
      );
    },
    // Add this reducer in cartSlice reducers
    updateItemQuantityDirectly: (state, action) => {
      const { itemId, quantity } = action.payload;
      const existingItem = state.cartItems.find((item) => item.id === itemId);
      if (existingItem) {
        existingItem.quantity = quantity;
        existingItem.totalPrice = Number(existingItem.price) * quantity;
      }
      // Recalculate totalAmount and totalQuantity after the update
      state.totalAmount = state.cartItems.reduce(
        (total, item) => total + Number(item.totalPrice),
        0
      );
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
    },
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;
