import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Poem,
  FillBlankQuestion,
} from '@shared/api.interface';

export interface PoemListItem {
  id: string;
  title: string;
  author: string;
  difficulty: number;
  isRecited: boolean;
  recitedCount: number;
}

export interface PoetryListResponse {
  poems: PoemListItem[];
  total: number;
  recitedCount: number;
}

export interface ReciteResponse {
  success: boolean;
  isRecited: boolean;
  recitedCount: number;
}

export async function getPoetryList(): Promise<PoetryListResponse> {
  try {
    const response = await axiosForBackend.get('/api/poetry/list');
    return response.data;
  } catch (error) {
    logger.error('获取古诗列表失败', error);
    throw error;
  }
}

export async function getPoemDetail(id: string): Promise<Poem> {
  try {
    const response = await axiosForBackend.get(`/api/poetry/${id}`);
    return response.data;
  } catch (error) {
    logger.error(`获取古诗详情失败, id=${id}`, error);
    throw error;
  }
}

export async function getFillBlankQuestions(
  poemId: string,
): Promise<{ questions: FillBlankQuestion[] }> {
  try {
    const response = await axiosForBackend.get(
      `/api/poetry/fill-blank/${poemId}`,
    );
    return response.data;
  } catch (error) {
    logger.error(`获取填空题失败, poemId=${poemId}`, error);
    throw error;
  }
}

export async function recitePoem(poemId: string): Promise<ReciteResponse> {
  try {
    const response = await axiosForBackend.post('/api/poetry/recite', {
      poemId,
    });
    return response.data;
  } catch (error) {
    logger.error(`背诵打卡失败, poemId=${poemId}`, error);
    throw error;
  }
}
