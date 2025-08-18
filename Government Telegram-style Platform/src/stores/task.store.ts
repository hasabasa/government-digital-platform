import { create } from 'zustand';
import { Task, TaskStatus, TaskPriority, TaskComment } from '../types';
import apiService from '../services/api.service';
import websocketService from '../services/websocket.service';

interface TaskState {
  // State
  tasks: Task[];
  tasksByStatus: Record<TaskStatus, Task[]>;
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: (filters?: any) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  addTaskComment: (taskId: string, commentData: Partial<TaskComment>) => Promise<void>;
  getTaskComments: (taskId: string) => Promise<void>;
  addTaskAttachment: (taskId: string, file: File) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  clearError: () => void;
  
  // WebSocket handlers
  setupWebSocket: () => void;
  cleanupWebSocket: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  tasksByStatus: {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    cancelled: []
  },
  currentTask: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTasks: async (filters?: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getTasks(filters);
      const tasks = response.data;
      
      // Group tasks by status
      const tasksByStatus: Record<TaskStatus, Task[]> = {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
        cancelled: []
      };
      
      tasks.forEach(task => {
        if (tasksByStatus[task.status]) {
          tasksByStatus[task.status].push(task);
        }
      });
      
      set({ 
        tasks, 
        tasksByStatus, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks', 
        isLoading: false 
      });
    }
  },

  fetchTaskById: async (id: string) => {
    try {
      const task = await apiService.getTaskById(id);
      set({ currentTask: task });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch task' 
      });
    }
  },

  createTask: async (taskData: Partial<Task>) => {
    try {
      const task = await apiService.createTask(taskData);
      
      set(state => {
        const newTasks = [...state.tasks, task];
        const newTasksByStatus = { ...state.tasksByStatus };
        
        if (newTasksByStatus[task.status]) {
          newTasksByStatus[task.status].push(task);
        }
        
        return {
          tasks: newTasks,
          tasksByStatus: newTasksByStatus
        };
      });
      
      return task;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task' 
      });
      throw error;
    }
  },

  updateTask: async (id: string, taskData: Partial<Task>) => {
    try {
      await apiService.updateTask(id, taskData);
      
      set(state => {
        const updatedTasks = state.tasks.map(task => 
          task.id === id ? { ...task, ...taskData } : task
        );
        
        // Update tasksByStatus
        const newTasksByStatus: Record<TaskStatus, Task[]> = {
          todo: [],
          in_progress: [],
          review: [],
          done: [],
          cancelled: []
        };
        
        updatedTasks.forEach(task => {
          if (newTasksByStatus[task.status]) {
            newTasksByStatus[task.status].push(task);
          }
        });
        
        return {
          tasks: updatedTasks,
          tasksByStatus: newTasksByStatus
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task' 
      });
    }
  },

  deleteTask: async (id: string) => {
    try {
      await apiService.deleteTask(id);
      
      set(state => {
        const filteredTasks = state.tasks.filter(task => task.id !== id);
        
        // Update tasksByStatus
        const newTasksByStatus: Record<TaskStatus, Task[]> = {
          todo: [],
          in_progress: [],
          review: [],
          done: [],
          cancelled: []
        };
        
        filteredTasks.forEach(task => {
          if (newTasksByStatus[task.status]) {
            newTasksByStatus[task.status].push(task);
          }
        });
        
        return {
          tasks: filteredTasks,
          tasksByStatus: newTasksByStatus
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task' 
      });
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    try {
      await apiService.updateTaskStatus(id, status);
      
      set(state => {
        const updatedTasks = state.tasks.map(task => 
          task.id === id ? { ...task, status } : task
        );
        
        // Update tasksByStatus
        const newTasksByStatus: Record<TaskStatus, Task[]> = {
          todo: [],
          in_progress: [],
          review: [],
          done: [],
          cancelled: []
        };
        
        updatedTasks.forEach(task => {
          if (newTasksByStatus[task.status]) {
            newTasksByStatus[task.status].push(task);
          }
        });
        
        return {
          tasks: updatedTasks,
          tasksByStatus: newTasksByStatus
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task status' 
      });
    }
  },

  addTaskComment: async (taskId: string, commentData: Partial<TaskComment>) => {
    try {
      const comment = await apiService.addTaskComment(taskId, commentData);
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, comments: [...task.comments, comment] }
            : task
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add comment' 
      });
    }
  },

  getTaskComments: async (taskId: string) => {
    try {
      const comments = await apiService.getTaskComments(taskId);
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, comments }
            : task
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch comments' 
      });
    }
  },

  addTaskAttachment: async (taskId: string, file: File) => {
    try {
      const attachment = await apiService.addTaskAttachment(taskId, file);
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, attachments: [...task.attachments, attachment] }
            : task
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add attachment' 
      });
    }
  },

  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  },

  clearError: () => set({ error: null }),

  // WebSocket setup
  setupWebSocket: () => {
    const unsubscribe = websocketService.onMessage((event) => {
      switch (event.type) {
        case 'task:created':
          if (event.payload.task) {
            get().createTask(event.payload.task);
          }
          break;
          
        case 'task:updated':
          if (event.payload.task) {
            get().updateTask(event.payload.task.id, event.payload.task);
          }
          break;
          
        case 'task:deleted':
          if (event.payload.taskId) {
            get().deleteTask(event.payload.taskId);
          }
          break;
          
        case 'task:status_changed':
          if (event.payload.taskId && event.payload.status) {
            get().updateTaskStatus(event.payload.taskId, event.payload.status as TaskStatus);
          }
          break;
      }
    });

    // Store unsubscribe function for cleanup
    (get as any).unsubscribeWebSocket = unsubscribe;
  },

  cleanupWebSocket: () => {
    const unsubscribe = (get as any).unsubscribeWebSocket;
    if (unsubscribe) {
      unsubscribe();
      (get as any).unsubscribeWebSocket = null;
    }
  },
}));
