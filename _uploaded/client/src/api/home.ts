import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { HomeSummary, ModuleSummary } from '@shared/api.interface';

export async function getHomeSummary(): Promise<HomeSummary> {
  try {
    const response = await axiosForBackend({
      url: '/api/home/summary',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取首页数据失败', error);
    throw error;
  }
}

export async function getModulesSummary(): Promise<ModuleSummary[]> {
  try {
    const response = await axiosForBackend({
      url: '/api/modules/summary',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取模块概览失败', error);
    throw error;
  }
}
