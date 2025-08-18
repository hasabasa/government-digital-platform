import { create } from 'zustand';
import { Order, OrderStatus, OrderType, OrderPriority } from '../types';
import apiService from '../services/api.service';

interface OrderState {
  // State
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: (filters?: any) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  // Initial state
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  // Actions
  fetchOrders: async (filters?: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getOrders(filters);
      set({ 
        orders: response.data, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch orders', 
        isLoading: false 
      });
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      const order = await apiService.getOrderById(id);
      set({ currentOrder: order });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch order' 
      });
    }
  },

  createOrder: async (orderData: Partial<Order>) => {
    try {
      const order = await apiService.createOrder(orderData);
      
      set(state => ({
        orders: [...state.orders, order]
      }));
      
      return order;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create order' 
      });
      throw error;
    }
  },

  updateOrder: async (id: string, orderData: Partial<Order>) => {
    try {
      await apiService.updateOrder(id, orderData);
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, ...orderData } : order
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update order' 
      });
    }
  },

  deleteOrder: async (id: string) => {
    try {
      await apiService.deleteOrder(id);
      
      set(state => ({
        orders: state.orders.filter(order => order.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete order' 
      });
    }
  },

  setCurrentOrder: (order: Order | null) => {
    set({ currentOrder: order });
  },

  clearError: () => set({ error: null }),
}));
