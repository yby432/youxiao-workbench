import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Star, X, ArrowLeft, RotateCcw, Clock, Trophy, Sparkles } from 'lucide-react';
import type { MathCategory, MathQuestion } from '@shared/api.interface';
import { getMathQuestions, submitMathPractice } from '@client/src/api/math';
import { Button } from '@client/src/components/ui/button';
import { Progress } from '@client/src/components/ui/progress';

interface MathPracticeProps {
  category: MathCategory;
  categoryName: string;
  onBack: () => void;
  onComplete: () => void;
}

type AnswerStatus = 'idle' | 'correct' | 'wrong';

interface AnswerRecord {
  questionId: string;
  correct: boolean;
  timeSpent: number;
}

const ENCOURAGE_CORRECT = ['太棒了！', '真厉害！', '答对啦！', '好聪明！', '完美！'];
const ENCOURAGE_WRONG = ['没关系，再试试！', '加油，下次一定对！', '别灰心哦！', '继续努力！'];

const MathPractice = ({ category, categoryName, onBack, onComplete }: MathPracticeProps) => {
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const questionStartRef = useRef<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [encourageText, setEncourageText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMathQuestions(category, 10);
      setQuestions(data.questions);
      setAnswers([]);
      setCurrentIndex(0);
      setAnswerStatus('idle');
      setSelectedOption(null);
      setElapsedTime(0);
      setShowResult(false);
      questionStartRef.current = Date.now();
    } catch (error) {
      logger.error('加载题目失败', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // 计时器
  useEffect(() => {
    if (loading || showResult) return;
    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, showResult]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = useCallback(
    (option: string) => {
      if (answerStatus !== 'idle') return;
      const current = questions[currentIndex];
      if (!current) return;

      setSelectedOption(option);
      const timeForQuestion = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));
      const isCorrect = option === current.answer;

      const record: AnswerRecord = {
        questionId: current.id,
        correct: isCorrect,
        timeSpent: timeForQuestion,
      };
      setAnswers((prev) => [...prev, record]);

      if (isCorrect) {
        setAnswerStatus('correct');
        setEncourageText(ENCOURAGE_CORRECT[Math.floor(Math.random() * ENCOURAGE_CORRECT.length)]);
      } else {
        setAnswerStatus('wrong');
        setEncourageText(ENCOURAGE_WRONG[Math.floor(Math.random() * ENCOURAGE_WRONG.length)]);
      }
    },
    [answerStatus, questions, currentIndex],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswerStatus('idle');
      setSelectedOption(null);
      questionStartRef.current = Date.now();
    } else {
      // 最后一题，提交结果
      setSubmitting(true);
      submitMathPractice({
        category,
        results: answers,
      })
        .then(() => {
          onComplete();
        })
        .catch((error) => {
          logger.error('提交练习结果失败', error);
        })
        .finally(() => {
          setSubmitting(false);
          setShowResult(true);
        });
    }
  }, [currentIndex, questions.length, category, answers, onComplete]);

  const correctCount = answers.filter((a: AnswerRecord) => a.correct).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">暂无题目</div>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      </div>
    );
  }

  if (showResult) {
    const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    const totalTime = answers.reduce((sum: number, a: AnswerRecord) => sum + a.timeSpent, 0);

    return (
      <div className="flex flex-col items-center py-6 gap-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-module-math flex items-center justify-center shadow-lg">
            <Trophy className="w-14 h-14 text-module-math-foreground" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 fill-yellow-400" />
          <Sparkles className="absolute -bottom-1 -left-2 w-6 h-6 text-yellow-400 fill-yellow-400" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-heading text-foreground mb-1">练习完成！</h2>
          <p className="text-muted-foreground">{categoryName}</p>
        </div>

        <div className="w-full bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-success font-mono">{correctCount}</div>
              <div className="text-sm text-muted-foreground mt-1">答对</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-module-math-foreground font-mono">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">正确率</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-foreground font-mono">
                {formatTime(totalTime)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">用时</div>
            </div>
          </div>
        </div>

        {/* 星星展示 */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i: number) => {
            const threshold = [60, 80, 95];
            const filled = accuracy >= threshold[i];
            return (
              <Star
                key={i}
                className={`w-10 h-10 ${
                  filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                }`}
              />
            );
          })}
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1 rounded-full h-12 text-base"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </Button>
          <Button
            className="flex-1 rounded-full h-12 text-base bg-module-math text-module-math-foreground hover:opacity-90"
            onClick={loadQuestions}
            disabled={submitting}
          >
            <RotateCcw className="w-5 h-5" />
            再来一次
          </Button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col gap-5">
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
        <div className="text-sm font-medium text-module-math-foreground">
          第 {currentIndex + 1} / {questions.length} 题
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-module-math/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-module-math transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 题目卡片 */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="text-xs text-module-math-foreground bg-module-math/30 inline-block px-3 py-1 rounded-full mb-4">
          {categoryName}
        </div>
        <h3 className="text-2xl font-heading text-foreground text-center leading-relaxed">
          {current.questionText}
        </h3>
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-3">
        {current.options?.map((option: string, idx: number) => {
          const isSelected = selectedOption === option;
          const isCorrectAnswer = option === current.answer;
          let btnClass =
            'bg-white border-2 border-border hover:border-module-math text-foreground shadow-sm';
          if (answerStatus !== 'idle') {
            if (isCorrectAnswer) {
              btnClass =
                'bg-success/20 border-2 border-success text-success-foreground shadow-md scale-105';
            } else if (isSelected && answerStatus === 'wrong') {
              btnClass =
                'bg-destructive/20 border-2 border-destructive text-destructive-foreground';
            } else {
              btnClass = 'bg-white border-2 border-border text-muted-foreground opacity-50';
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(option)}
              disabled={answerStatus !== 'idle'}
              className={`${btnClass} rounded-2xl py-6 text-2xl font-bold font-mono transition-all duration-200 active:scale-95 min-h-[80px] flex items-center justify-center`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* 答题反馈 */}
      {answerStatus !== 'idle' && (
        <div
          className={`rounded-2xl p-5 transition-all duration-300 ${
            answerStatus === 'correct'
              ? 'bg-success/15 border border-success/30'
              : 'bg-destructive/10 border border-destructive/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            {answerStatus === 'correct' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <span className="text-xl font-heading text-success-foreground">
                  {encourageText}
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
                  <X className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-heading text-destructive-foreground">
                  {encourageText}
                </span>
              </>
            )}
          </div>
          {answerStatus === 'wrong' && (
            <div className="text-sm text-muted-foreground pl-12">
              <p>
                正确答案：
                <span className="font-bold text-success-foreground">{current.answer}</span>
              </p>
              {current.explanation && <p className="mt-1">{current.explanation}</p>}
            </div>
          )}
          {answerStatus === 'correct' && current.explanation && (
            <p className="text-sm text-muted-foreground pl-12">{current.explanation}</p>
          )}
        </div>
      )}

      {/* 下一题按钮 */}
      {answerStatus !== 'idle' && (
        <Button
          className="w-full rounded-full h-12 text-base bg-module-math text-module-math-foreground hover:opacity-90"
          onClick={handleNext}
        >
          {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果'}
        </Button>
      )}
    </div>
  );
};

export default MathPractice;
