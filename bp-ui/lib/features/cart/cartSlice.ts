import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  productId:  number;
  name:       string;
  price:      number;
  artistName: string;
  type:       "physical" | "digital";
  quantity:   number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },

    addItem(state, action: PayloadAction<Omit<CartItem, "quantity">>) {
      const existing = state.items.find((i) => i.productId === action.payload.productId);

      if(existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },

    updateQuantity(state, action: PayloadAction<{ productId: number; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);

      if(item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },

    clearCart(state) {
      state.items = [];
    },
  },
});

export const { hydrateCart, addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
