import { create } from 'zustand';
import { taskService, Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../services/taskService';

export type FilterStatus = 'all' | TaskStatus;
export type FilterPriority = 'all' | TaskPriority;

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filterStatus: FilterStatus;
  filterPriority: FilterPriority;

  setFilterStatus: (filter: FilterStatus) => void;
  setFilterPriority: (filter: FilterPriority) => void;

  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleDone: (task: Task) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filterStatus: 'all',
  filterPriority: 'all',

  setFilterStatus: (filter) => set({ filterStatus: filter }),
  setFilterPriority: (filter) => set({ filterPriority: filter }),

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filterStatus, filterPriority } = get();
      const res = await taskService.list({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
      });
      set({ tasks: res.tasks, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load tasks', isLoading: false });
    }
  },

  createTask: async (data) => {
    const res = await taskService.create(data);
    set((state) => ({ tasks: [res.task, ...state.tasks] }));
  },

  updateTask: async (id, data) => {
    const res = await taskService.update(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? res.task : t)),
    }));
  },

  deleteTask: async (id) => {
    await taskService.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  toggleDone: async (task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t,
      ),
    }));
    try {
      await taskService.update(task.id, { status: newStatus });
    } catch {
      // Revert on failure
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === task.id ? { ...t, status: task.status } : t,
        ),
      }));
    }
  },
}));
