import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  UserLearningProfile,
  DailyTasksResponse,
  CheckinStats,
  CheckinStatus,
  DailyTask,
} from '@shared/api.interface';

export interface CalendarDay {
  date: string;
  status: CheckinStatus;
  canSupplement: boolean;
}

export interface CalendarResponse {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface DayDetailResponse {
  date: string;
  status: CheckinStatus;
  completedTasks: string[];
  allTasks: DailyTask[];
}

export interface CompleteTaskResponse {
  success: boolean;
  beanEarned: number;
  newBalance: number;
  streakUpdated: boolean;
}

export interface SupplementResponse {
  success: boolean;
  beanCost: number;
  newBalance: number;
  newStatus: CheckinStatus;
}

export async function getProfile(): Promise<UserLearningProfile> {
  const res = await axiosForBackend.get('/api/user/profile');
  return res.data;
}

export async function getDailyTasks(): Promise<DailyTasksResponse> {
  const res = await axiosForBackend.get('/api/checkin/daily-tasks');
  return res.data;
}

export async function completeTask(
  taskId: string,
  module: string,
): Promise<CompleteTaskResponse> {
  const res = await axiosForBackend.post('/api/checkin/daily-tasks/complete', {
    taskId,
    module,
  });
  return res.data;
}

export async function getCheckinStats(): Promise<CheckinStats> {
  const res = await axiosForBackend.get('/api/checkin/stats');
  return res.data;
}

export async function getCalendar(
  year: number,
  month: number,
): Promise<CalendarResponse> {
  const res = await axiosForBackend.get('/api/checkin/calendar', {
    params: { year, month },
  });
  return res.data;
}

export async function supplementCheckin(date: string): Promise<SupplementResponse> {
  const res = await axiosForBackend.post('/api/checkin/supplement', { date });
  return res.data;
}

export async function getDayDetail(date: string): Promise<DayDetailResponse> {
  const res = await axiosForBackend.get(`/api/checkin/day/${date}`);
  return res.data;
}
