import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Prize,
  PrizeTier,
  UserLearningProfile,
  ExchangeOrder,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getPrizes(tier?: PrizeTier): Promise<Prize[]> {
  try {
    const params: Record<string, string> = {};
    if (tier) params.tier = tier;
    const response = await axiosForBackend.get('/api/shop/prizes', { params });
    return response.data;
  } catch (error) {
    logger.error('获取奖品列表失败', error);
    throw error;
  }
}

export async function getPrizeDetail(id: string): Promise<Prize> {
  try {
    const response = await axiosForBackend.get(`/api/shop/prizes/${id}`);
    return response.data;
  } catch (error) {
    logger.error(`获取奖品详情失败 id=${id}`, error);
    throw error;
  }
}

export async function exchangePrize(params: {
  prizeId: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
}): Promise<{ success: boolean; orderId: string; beanCost: number; newBalance: number }> {
  try {
    const response = await axiosForBackend.post('/api/shop/exchange', params);
    return response.data;
  } catch (error) {
    logger.error('兑换奖品失败', error);
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

export async function getExchangeOrders(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<ExchangeOrder>> {
  try {
    const response = await axiosForBackend.get('/api/user/exchange-orders', {
      params: { page, pageSize },
    });
    return response.data;
  } catch (error) {
    logger.error('获取兑换记录失败', error);
    throw error;
  }
}
