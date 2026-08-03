export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type CharacterStatus = 'unlearned' | 'learning' | 'mastered';

export interface ChineseCharacter {
  id: string;
  character: string;
  pinyin: string;
  radical: string;
  strokeCount: number;
  words: string[];
  unit: number;
  lesson: number;
  strokeOrder: string[];
}

export interface LiteracyProgress {
  characterId: string;
  status: CharacterStatus;
  isWeak: boolean;
  reviewCount: number;
}

export interface LiteracyStats {
  total: number;
  learned: number;
  mastered: number;
  weakCount: number;
  unitMasteryRate: Array<{ unit: number; rate: number }>;
}

export interface LiteracyUnitGroup {
  unit: number;
  lessons: Array<{
    lesson: number;
    characters: Array<ChineseCharacter & { status: CharacterStatus; isWeak: boolean }>;
  }>;
}

export type PinyinCategory = 'initial' | 'final' | 'whole' | 'tone' | 'spelling';

export interface PinyinItem {
  id: string;
  category: PinyinCategory;
  content: string;
  example: string;
  audioHint: string;
}

export interface PinyinProgress {
  category: PinyinCategory;
  correctCount: number;
  totalCount: number;
  accuracy: number;
}

export interface PinyinQuestion {
  id: string;
  type: 'write' | 'match' | 'tone';
  question: string;
  imageHint?: string;
  options?: string[];
  answer: string;
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  content: string[];
  pinyinContent: string[];
  translation: string;
  illustration: string;
  difficulty: number;
}

export interface PoetryProgress {
  poemId: string;
  isRecited: boolean;
  recitedCount: number;
  lastRecitedAt: string;
}

export interface FillBlankQuestion {
  lineIndex: number;
  blankIndex: number;
  answer: string;
  hint: string;
}

export type EnglishCategory = 'alphabet' | 'word' | 'sentence';
export type EnglishLevel = 'beginner' | 'basic';

export interface EnglishItem {
  id: string;
  category: EnglishCategory;
  subcategory: string;
  content: string;
  meaning: string;
  imageHint: string;
  level: EnglishLevel;
}

export interface EnglishProgress {
  category: EnglishCategory;
  learnedCount: number;
  totalCount: number;
  correctRate: number;
}

export type MathCategory =
  | 'addition_subtraction_10'
  | 'addition_subtraction_20'
  | 'number_sense'
  | 'comparison'
  | 'clock'
  | 'shape'
  | 'pattern';

export type MathQuestionType = 'choice' | 'drag' | 'timed';

export interface MathQuestion {
  id: string;
  category: MathCategory;
  questionType: MathQuestionType;
  questionText: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: number;
}

export interface MathCategoryProgress {
  key: MathCategory;
  name: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
}

export interface MathStats {
  totalPractice: number;
  overallAccuracy: number;
  todayPracticeTime: number;
}

export type ScienceCategory = 'astronomy' | 'animals_plants' | 'life' | 'nature' | 'safety';

export interface ScienceArticle {
  id: string;
  category: ScienceCategory;
  title: string;
  content: string;
  imageHint: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: number;
  }>;
}

export interface ScienceProgress {
  articleId: string;
  isRead: boolean;
  quizCorrect?: boolean;
}

export interface ScienceProgressStats {
  totalRead: number;
  totalArticles: number;
  byCategory: Array<{ category: ScienceCategory; readCount: number; totalCount: number }>;
}

export type CheckinStatus = 'none' | 'partial' | 'full';

export interface DailyTask {
  id: string;
  module: string;
  name: string;
  beanReward: number;
  completed: boolean;
}

export interface DailyTasksResponse {
  date: string;
  tasks: DailyTask[];
  status: CheckinStatus;
}

export interface CheckinRecord {
  date: string;
  status: CheckinStatus;
  canSupplement: boolean;
}

export interface CheckinStats {
  currentStreak: number;
  totalCheckinDays: number;
  monthCompleteRate: number;
}

export interface BeanTransaction {
  id: string;
  amount: number;
  reason: string;
  sourceType: 'task' | 'streak' | 'exchange' | 'supplement';
  balanceAfter: number;
  createdAt: string;
}

export interface UserLearningProfile {
  userId: string;
  beanBalance: number;
  currentStreak: number;
  totalCheckinDays: number;
  totalStudyTime: number;
}

export type PrizeTier = 'low' | 'medium' | 'high';

export interface Prize {
  id: string;
  name: string;
  description: string;
  imageHint: string;
  price: number;
  tier: PrizeTier;
  stock: number;
}

export interface ExchangeOrder {
  id: string;
  prizeId: string;
  prizeName: string;
  prizeImage: string;
  beanCost: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ExchangeResult {
  success: boolean;
  orderId: string;
  beanCost: number;
  newBalance: number;
}

export interface ModuleSummary {
  key: string;
  name: string;
  progress: number;
  todayDone: boolean;
  color: string;
  icon: string;
}

export interface HomeSummary {
  profile: {
    beanBalance: number;
    currentStreak: number;
    totalCheckinDays: number;
  };
  modules: ModuleSummary[];
  dailyTasks: DailyTask[];
}

export interface LearningReport {
  literacy: {
    total: number;
    mastered: number;
    weakCount: number;
  };
  moduleTime: Array<{ module: string; name: string; minutes: number }>;
  weeklyTrend: Array<{ date: string; minutes: number }>;
  weakPoints: Array<{ module: string; name: string; suggestion: string }>;
  streakDays: number;
  totalBeans: number;
  exchangeCount: number;
}
