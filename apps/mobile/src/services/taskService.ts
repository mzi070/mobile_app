import { api } from './api';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
  recurringPattern?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  category?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

interface TaskResponse {
  task: Task;
}

export const taskService = {
  list: (params?: { status?: TaskStatus; priority?: TaskPriority; page?: number }) => {
    const query: Record<string, string> = {};
    if (params?.status) query.status = params.status;
    if (params?.priority) query.priority = params.priority;
    if (params?.page) query.page = String(params.page);
    return api.get<TaskListResponse>('/api/tasks', query);
  },

  get: (id: string) => api.get<TaskResponse>(`/api/tasks/${id}`),

  create: (data: CreateTaskInput) =>
    api.post<TaskResponse>('/api/tasks', data),

  update: (id: string, data: UpdateTaskInput) =>
    api.patch<TaskResponse>(`/api/tasks/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/api/tasks/${id}`),
};
