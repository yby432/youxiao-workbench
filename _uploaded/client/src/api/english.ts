import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  EnglishCategory,
  EnglishItem,
  EnglishLevel,
  EnglishProgress,
} from '@shared/api.interface';

export interface ItemsResponse {
  category: EnglishCategory;
  subcategory?: string;
  level: EnglishLevel;
  items: EnglishItem[];
}

export interface ProgressResponse {
  level: EnglishLevel;
  categories: EnglishProgress[];
}

export async function getEnglishItems(
  category: EnglishCategory,
  level: EnglishLevel,
  subcategory?: string,
): Promise<ItemsResponse> {
  try {
    const params: Record<string, string> = { category, level };
    if (subcategory) params.subcategory = subcategory;
    const response = await axiosForBackend.get('/api/english/items', { params });
    return response.data;
  } catch (error) {
    logger.error('获取英语内容失败', error);
    throw error;
  }
}

export async function getEnglishProgress(level: EnglishLevel): Promise<ProgressResponse> {
  try {
    const response = await axiosForBackend.get('/api/english/progress', {
      params: { level },
    });
    return response.data;
  } catch (error) {
    logger.error('获取英语进度失败', error);
    throw error;
  }
}

export async function submitEnglishPractice(
  itemId: string,
  level: EnglishLevel,
  correct: boolean,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend.post('/api/english/practice', {
      itemId,
      level,
      correct,
    });
    return response.data;
  } catch (error) {
    logger.error('提交英语练习失败', error);
    throw error;
  }
}
