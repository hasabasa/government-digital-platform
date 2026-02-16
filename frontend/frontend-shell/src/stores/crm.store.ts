import { create } from 'zustand';
import { apiService } from '../services/api.service';
import { CrmLead, CrmLeadHistory, CrmSalesPlan, CrmAccessEntry, CrmManagerStats, CrmDashboardData, FunnelStage, TrafficChannel, LeadResult } from '../types';
import toast from 'react-hot-toast';

interface CrmFilters {
  stage?: FunnelStage;
  trafficChannel?: TrafficChannel;
  result?: LeadResult;
  assignedTo?: string;
  search?: string;
  page: number;
  limit: number;
}

interface CrmState {
  // Leads
  leads: CrmLead[];
  selectedLead: CrmLead | null;
  leadHistory: CrmLeadHistory[];
  totalLeads: number;
  totalPages: number;

  // Dashboard
  dashboard: CrmDashboardData | null;
  managerStats: CrmManagerStats[];

  // Plans
  salesPlans: CrmSalesPlan[];

  // Access
  accessList: CrmAccessEntry[];
  hasCrmAccess: boolean;

  // UI
  activeTab: string;
  filters: CrmFilters;
  loading: boolean;
}

interface CrmActions {
  // Leads
  fetchLeads: () => Promise<void>;
  createLead: (data: any) => Promise<void>;
  updateLead: (id: string, data: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLeadStage: (id: string, toStage: FunnelStage, comment?: string) => Promise<void>;
  selectLead: (lead: CrmLead | null) => void;
  fetchLeadHistory: (id: string) => Promise<void>;

  // Dashboard
  fetchDashboard: () => Promise<void>;
  fetchManagerStats: () => Promise<void>;

  // Plans
  fetchSalesPlans: () => Promise<void>;
  createSalesPlan: (data: any) => Promise<void>;
  updateSalesPlan: (id: string, data: any) => Promise<void>;
  deleteSalesPlan: (id: string) => Promise<void>;

  // Access
  fetchAccessList: () => Promise<void>;
  grantAccess: (userId: string) => Promise<void>;
  revokeAccess: (userId: string) => Promise<void>;
  checkMyAccess: () => Promise<void>;

  // UI
  setActiveTab: (tab: string) => void;
  setFilters: (filters: Partial<CrmFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: CrmFilters = { page: 1, limit: 20 };

export const useCrmStore = create<CrmState & CrmActions>()((set, get) => ({
  // State
  leads: [],
  selectedLead: null,
  leadHistory: [],
  totalLeads: 0,
  totalPages: 0,
  dashboard: null,
  managerStats: [],
  salesPlans: [],
  accessList: [],
  hasCrmAccess: false,
  activeTab: 'pipeline',
  filters: { ...defaultFilters },
  loading: false,

  // === Leads ===

  fetchLeads: async () => {
    set({ loading: true });
    try {
      const { filters } = get();
      const res = await apiService.getCrmLeads(filters as any);
      const data = res.data;
      set({
        leads: data.leads,
        totalLeads: data.total,
        totalPages: data.totalPages,
      });
    } catch (e) {
      console.error('fetchLeads error', e);
    } finally {
      set({ loading: false });
    }
  },

  createLead: async (data) => {
    try {
      await apiService.createCrmLead(data);
      toast.success('Лид создан');
      get().fetchLeads();
    } catch (e) {
      console.error('createLead error', e);
    }
  },

  updateLead: async (id, data) => {
    try {
      await apiService.updateCrmLead(id, data);
      toast.success('Лид обновлён');
      get().fetchLeads();
    } catch (e) {
      console.error('updateLead error', e);
    }
  },

  deleteLead: async (id) => {
    try {
      await apiService.deleteCrmLead(id);
      toast.success('Лид удалён');
      set({ selectedLead: null });
      get().fetchLeads();
    } catch (e) {
      console.error('deleteLead error', e);
    }
  },

  moveLeadStage: async (id, toStage, comment) => {
    try {
      await apiService.moveCrmLeadStage(id, { toStage, comment });
      toast.success('Стадия изменена');
      get().fetchLeads();
    } catch (e) {
      console.error('moveLeadStage error', e);
    }
  },

  selectLead: (lead) => set({ selectedLead: lead }),

  fetchLeadHistory: async (id) => {
    try {
      const res = await apiService.getCrmLeadHistory(id);
      set({ leadHistory: res.data });
    } catch (e) {
      console.error('fetchLeadHistory error', e);
    }
  },

  // === Dashboard ===

  fetchDashboard: async () => {
    try {
      const res = await apiService.getCrmDashboard();
      set({ dashboard: res.data });
    } catch (e) {
      console.error('fetchDashboard error', e);
    }
  },

  fetchManagerStats: async () => {
    try {
      const res = await apiService.getCrmManagerStats();
      set({ managerStats: res.data });
    } catch (e) {
      console.error('fetchManagerStats error', e);
    }
  },

  // === Plans ===

  fetchSalesPlans: async () => {
    try {
      const res = await apiService.getCrmSalesPlans();
      set({ salesPlans: res.data });
    } catch (e) {
      console.error('fetchSalesPlans error', e);
    }
  },

  createSalesPlan: async (data) => {
    try {
      await apiService.createCrmSalesPlan(data);
      toast.success('План создан');
      get().fetchSalesPlans();
    } catch (e) {
      console.error('createSalesPlan error', e);
    }
  },

  updateSalesPlan: async (id, data) => {
    try {
      await apiService.updateCrmSalesPlan(id, data);
      toast.success('План обновлён');
      get().fetchSalesPlans();
    } catch (e) {
      console.error('updateSalesPlan error', e);
    }
  },

  deleteSalesPlan: async (id) => {
    try {
      await apiService.deleteCrmSalesPlan(id);
      toast.success('План удалён');
      get().fetchSalesPlans();
    } catch (e) {
      console.error('deleteSalesPlan error', e);
    }
  },

  // === Access ===

  fetchAccessList: async () => {
    try {
      const res = await apiService.getCrmAccessList();
      set({ accessList: res.data });
    } catch (e) {
      console.error('fetchAccessList error', e);
    }
  },

  grantAccess: async (userId) => {
    try {
      await apiService.grantCrmAccess(userId);
      toast.success('Доступ выдан');
      get().fetchAccessList();
    } catch (e) {
      console.error('grantAccess error', e);
    }
  },

  revokeAccess: async (userId) => {
    try {
      await apiService.revokeCrmAccess(userId);
      toast.success('Доступ отозван');
      get().fetchAccessList();
    } catch (e) {
      console.error('revokeAccess error', e);
    }
  },

  checkMyAccess: async () => {
    try {
      const res = await apiService.checkCrmAccess();
      set({ hasCrmAccess: res.data.hasAccess });
    } catch (e) {
      set({ hasCrmAccess: false });
    }
  },

  // === UI ===

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchLeads();
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().fetchLeads();
  },
}));
