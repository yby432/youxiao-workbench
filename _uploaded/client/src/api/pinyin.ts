import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PinyinCategory,
  PinyinItem,
  PinyinProgress,
  PinyinQuestion,
} from '@shared/api.interface';

export async function getPinyinItems(
  category: PinyinCategory,
): Promise<{ category: PinyinCategory; items: PinyinItem[] }> {
  try {
    const response = await axiosForBackend({
      url: '/api/pinyin/items',
      method: 'GET',
      params: { category },
    });
    return response.data;
  } catch (error) {
    logger.error('获取拼音列表失败', error);
    throw error;
  }
}

export async function getPinyinProgress(): Promise<{ categories: PinyinProgress[] }> {
  try {
    const response = await axiosForBackend({
      url: '/api/pinyin/progress',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取拼音进度失败', error);
    throw error;
  }
}

export async function getPracticeQuestions(
  type: 'write' | 'match' | 'tone',
  count = 10,
): Promise<{ questions: PinyinQuestion[] }> {
  try {
    const response = await axiosForBackend({
      url: '/api/pinyin/practice-questions',
      method: 'GET',
      params: { type, count },
    });
    return response.data;
  } catch (error) {
    logger.error('获取练习题失败', error);
    throw error;
  }
}

export async function submitPractice(
  category: string,
  results: Array<{ questionId: string; correct: boolean }>,
): Promise<{ success: boolean; correctCount: number; totalCount: number }> {
  try {
    const response = await axiosForBackend({
      url: '/api/pinyin/practice',
      method: 'POST',
      data: { category, results },
    });
    return response.data;
  } catch (error) {
    logger.error('提交练习结果失败', error);
    throw error;
  }
}
