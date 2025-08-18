import { create } from 'zustand';
import { Attachment, FileUpload } from '../types';
import apiService from '../services/api.service';

interface FileState {
  // State
  uploads: FileUpload[];
  userFiles: Attachment[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<Attachment>;
  uploadMultipleFiles: (files: File[], onProgress?: (progress: number) => void) => Promise<Attachment[]>;
  fetchUserFiles: () => Promise<void>;
  downloadFile: (id: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  getFileUrl: (id: string) => Promise<string>;
  clearUploads: () => void;
  clearError: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  // Initial state
  uploads: [],
  userFiles: [],
  isLoading: false,
  error: null,

  // Actions
  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    // Create upload entry
    const upload: FileUpload = {
      file,
      progress: 0,
      status: 'uploading'
    };
    
    set(state => ({
      uploads: [...state.uploads, upload]
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        set(state => ({
          uploads: state.uploads.map(u => 
            u.file === file 
              ? { ...u, progress: Math.min(u.progress + 10, 90) }
              : u
          )
        }));
      }, 100);

      const attachment = await apiService.uploadFile(file, (progress) => {
        if (onProgress) onProgress(progress);
      });

      clearInterval(progressInterval);

      // Update upload status
      set(state => ({
        uploads: state.uploads.map(u => 
          u.file === file 
            ? { ...u, progress: 100, status: 'success' }
            : u
        )
      }));

      return attachment;
    } catch (error) {
      // Update upload status to error
      set(state => ({
        uploads: state.uploads.map(u => 
          u.file === file 
            ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : u
        ),
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
      
      throw error;
    }
  },

  uploadMultipleFiles: async (files: File[], onProgress?: (progress: number) => void) => {
    const uploads: FileUpload[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    set(state => ({
      uploads: [...state.uploads, ...uploads]
    }));

    try {
      const attachments = await apiService.uploadMultipleFiles(files, onProgress);
      
      // Update all uploads to success
      set(state => ({
        uploads: state.uploads.map(u => 
          files.includes(u.file) 
            ? { ...u, progress: 100, status: 'success' }
            : u
        )
      }));

      return attachments;
    } catch (error) {
      // Update all uploads to error
      set(state => ({
        uploads: state.uploads.map(u => 
          files.includes(u.file) 
            ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : u
        ),
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
      
      throw error;
    }
  },

  fetchUserFiles: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const files = await apiService.getUserFiles();
      set({ userFiles: files, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch files', 
        isLoading: false 
      });
    }
  },

  downloadFile: async (id: string) => {
    try {
      const blob = await apiService.downloadFile(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'download'; // You might want to get the filename from the response
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to download file' 
      });
    }
  },

  deleteFile: async (id: string) => {
    try {
      await apiService.deleteFile(id);
      
      set(state => ({
        userFiles: state.userFiles.filter(file => file.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      });
    }
  },

  getFileUrl: async (id: string): Promise<string> => {
    try {
      const response = await apiService.getFileUrl(id);
      return response.url;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get file URL' 
      });
      throw error;
    }
  },

  clearUploads: () => set({ uploads: [] }),
  
  clearError: () => set({ error: null }),
}));
