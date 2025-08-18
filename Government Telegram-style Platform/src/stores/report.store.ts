import { create } from 'zustand';
import { Report, ReportStatus, ReportType } from '../types';
import apiService from '../services/api.service';

interface ReportState {
  // State
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchReports: (filters?: any) => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  createReport: (reportData: Partial<Report>) => Promise<Report>;
  updateReport: (id: string, reportData: Partial<Report>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  setCurrentReport: (report: Report | null) => void;
  clearError: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  // Initial state
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,

  // Actions
  fetchReports: async (filters?: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getReports(filters);
      set({ 
        reports: response.data, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reports', 
        isLoading: false 
      });
    }
  },

  fetchReportById: async (id: string) => {
    try {
      const report = await apiService.getReportById(id);
      set({ currentReport: report });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch report' 
      });
    }
  },

  createReport: async (reportData: Partial<Report>) => {
    try {
      const report = await apiService.createReport(reportData);
      
      set(state => ({
        reports: [...state.reports, report]
      }));
      
      return report;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create report' 
      });
      throw error;
    }
  },

  updateReport: async (id: string, reportData: Partial<Report>) => {
    try {
      await apiService.updateReport(id, reportData);
      
      set(state => ({
        reports: state.reports.map(report => 
          report.id === id ? { ...report, ...reportData } : report
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update report' 
      });
    }
  },

  deleteReport: async (id: string) => {
    try {
      await apiService.deleteReport(id);
      
      set(state => ({
        reports: state.reports.filter(report => report.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete report' 
      });
    }
  },

  setCurrentReport: (report: Report | null) => {
    set({ currentReport: report });
  },

  clearError: () => set({ error: null }),
}));
