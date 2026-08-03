import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  MathCategory,
  MathCategoryProgress,
  MathQuestion,
  MathStats,
} from '@shared/api.interface';

export interface PracticeResultItem {
  questionId: string;
  correct: boolean;
  timeSpent: number;
}

export interface PracticeSubmitData {
  category: MathCategory;
  results: PracticeResultItem[];
}

export interface PracticeSubmitResponse {
  success: boolean;
  correctCount: number;
  totalCount: number;
  accuracy: number;
}

export async function getMathCategories(): Promise<{ categories: MathCategoryProgress[] }> {
  try {
    const response = await axiosForBackend.get('/api/math/categories');
    return response.data;
  } catch (error) {
    logger.error('获取数学分类失败', error);
    throw error;
  }
}

export async function getMathQuestions(
  category: MathCategory,
  count: number = 10,
  type?: string,
): Promise<{ questions: MathQuestion[] }> {
  try {
    const params: Record<string, string | number> = { category, count };
    if (type) params.type = type;
    const response = await axiosForBackend.get('/api/math/questions', { params });
    return response.data;
  } catch (error) {
    logger.error('获取数学习题失败', error);
    throw error;
  }
}

export async function submitMathPractice(
  data: PracticeSubmitData,
): Promise<PracticeSubmitResponse> {
  try {
    const response = await axiosForBackend.post('/api/math/practice', data);
    return response.data;
  } catch (error) {
    logger.error('提交数学练习失败', error);
    throw error;
  }
}

export async function getMathStats(): Promise<MathStats> {
  try {
    const response = await axiosForBackend.get('/api/math/stats');
    return response.data;
  } catch (error) {
    logger.error('获取数学统计失败', error);
    throw error;
  }
}
