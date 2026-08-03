import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ScienceArticle,
  ScienceProgressStats,
} from '@shared/api.interface';

export interface ArticleListItem {
  id: string;
  title: string;
  imageHint: string;
  isRead: boolean;
  quizCorrect: boolean | null;
}

export interface CategoryGroup {
  category: string;
  articles: ArticleListItem[];
}

export async function getScienceArticles(category?: string): Promise<CategoryGroup[]> {
  try {
    const response = await axiosForBackend({
      url: '/api/science/articles',
      method: 'GET',
      params: category ? { category } : undefined,
    });
    return response.data;
  } catch (error) {
    logger.error('获取科普文章列表失败', error);
    throw error;
  }
}

export async function getScienceArticle(id: string): Promise<ScienceArticle> {
  try {
    const response = await axiosForBackend({
      url: `/api/science/articles/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error(`获取文章详情失败, id=${id}`, error);
    throw error;
  }
}

export async function submitScienceQuiz(
  articleId: string,
  correct: boolean,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend({
      url: '/api/science/quiz',
      method: 'POST',
      data: { articleId, correct },
    });
    return response.data;
  } catch (error) {
    logger.error('提交问答结果失败', error);
    throw error;
  }
}

export async function getScienceProgress(): Promise<ScienceProgressStats> {
  try {
    const response = await axiosForBackend({
      url: '/api/science/progress',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取科普进度失败', error);
    throw error;
  }
}
