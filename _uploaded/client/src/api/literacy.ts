import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ChineseCharacter,
  CharacterStatus,
  LiteracyStats,
  LiteracyUnitGroup,
} from '@shared/api.interface';

export async function getCharacters(): Promise<LiteracyUnitGroup[]> {
  const res = await axiosForBackend.get('/api/literacy/characters');
  return res.data;
}

export async function getStats(): Promise<LiteracyStats> {
  const res = await axiosForBackend.get('/api/literacy/stats');
  return res.data;
}

export async function getWeakWords(): Promise<{ items: ChineseCharacter[]; total: number }> {
  const res = await axiosForBackend.get('/api/literacy/weak-words');
  return res.data;
}

export async function getCharacterDetail(id: string): Promise<ChineseCharacter> {
  const res = await axiosForBackend.get(`/api/literacy/characters/${id}`);
  return res.data;
}

export async function updateProgress(
  characterId: string,
  status: CharacterStatus,
  isWeak?: boolean
): Promise<{ success: boolean; status: string }> {
  const res = await axiosForBackend.put(`/api/literacy/progress/${characterId}`, { status, isWeak });
  return res.data;
}
