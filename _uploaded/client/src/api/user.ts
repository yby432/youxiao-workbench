import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  LearningReport,
  BeanTransaction,
  PaginatedResponse,
  UserLearningProfile,
} from '@shared/api.interface';

export async function getLearningReport(): Promise<LearningReport> {
  try {
    const response = await axiosForBackend.get('/api/user/learning-report');
    return response.data;
  } catch (error) {
    logger.error('获取学习报告失败', error);
    throw error;
  }
}

export async function getBeanTransactions(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<BeanTransaction>> {
  try {
    const response = await axiosForBackend.get('/api/user/bean-transactions', {
      params: { page, pageSize },
    });
    return response.data;
  } catch (error) {
    logger.error('获取学习豆流水失败', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserLearningProfile> {
  try {
    const response = await axiosForBackend.get('/api/user/profile');
    return response.data;
  } catch (error) {
    logger.error('获取用户档案失败', error);
    throw error;
  }
}
