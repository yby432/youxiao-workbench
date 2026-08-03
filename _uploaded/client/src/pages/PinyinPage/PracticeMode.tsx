import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Volume2, Star, X, ChevronLeft, Sparkles } from 'lucide-react';
import type { PinyinQuestion } from '@shared/api.interface';
import { getPracticeQuestions, submitPractice } from '@client/src/api/pinyin';

interface PracticeModeProps {
  type: 'write' | 'match' | 'tone';
  category: string;
  onBack: () => void;
  onComplete: () => void;
}

const typeNames: Record<string, string> = {
  write: '看图写拼音',
  match: '拼音连线',
  tone: '声调闯关',
};

const PracticeMode = ({ type, category, onBack, onComplete }: PracticeModeProps) => {
  const [questions, setQuestions] = useState<PinyinQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerResults, setAnswerResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [writeInput, setWriteInput] = useState('');
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPracticeQuestions(type, 10);
        setQuestions(data.questions);
      } catch (error) {
        logger.error('加载练习题失败', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.answer;

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
    const correct = option === currentQuestion.answer;
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
    setAnswerResults((prev) => [...prev, correct]);
    setRippleKey((prev) => prev + 1);
  };

  const handleWriteSubmit = () => {
    if (showResult || !writeInput.trim()) return;
    const answer = writeInput.trim().toLowerCase();
    setSelectedAnswer(answer);
    setShowResult(true);
    const correct = answer === currentQuestion.answer.toLowerCase();
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
    setAnswerResults((prev) => [...prev, correct]);
    setRippleKey((prev) => prev + 1);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setWriteInput('');
    } else {
      // 练习结束，提交结果
      try {
        const finalResults = questions.map((q: PinyinQuestion, idx: number) => ({
          questionId: q.id,
          correct: answerResults[idx] ?? false,
        }));
        await submitPractice(category, finalResults);
      } catch (error) {
        logger.error('提交练习结果失败', error);
      }
      setFinished(true);
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (finished) {
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-module-pinyin flex items-center justify-center">
            <span className="text-4xl font-bold text-module-pinyin-foreground">{score}分</span>
          </div>
          <div className="absolute -top-2 -right-2">
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="absolute -bottom-1 -left-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 text-heading">
          {score >= 80 ? '太棒了！🎉' : score >= 60 ? '继续加油！💪' : '别灰心，再来一次！🌟'}
        </h2>
        <p className="text-muted-foreground mb-8">
          答对 {correctCount} 题 / 共 {questions.length} 题
        </p>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground font-medium active:scale-95 transition-transform"
          >
            返回
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setCorrectCount(0);
              setAnswerResults([]);
              setFinished(false);
              setWriteInput('');
              // 重新加载题目
              setLoading(true);
              getPracticeQuestions(type, 10)
                .then((data) => {
                  setQuestions(data.questions);
                  setLoading(false);
                })
                .catch(() => setLoading(false));
            }}
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium active:scale-95 transition-transform"
          >
            再来一次
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">暂无题目</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-foreground">{typeNames[type]}</span>
        <div className="w-9" />
      </div>

      {/* 进度条 */}
      <div className="px-6 mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            第 {currentIndex + 1} 题
          </span>
          <span>共 {questions.length} 题</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-module-pinyin rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目区 */}
      <div className="flex-1 px-6 flex flex-col items-center justify-center">
        <div
          key={rippleKey}
          className={`relative w-full max-w-sm aspect-square rounded-3xl bg-module-pinyin flex flex-col items-center justify-center mb-6 shadow-md overflow-hidden ${
            showResult && isCorrect ? 'animate-pulse' : ''
          }`}
        >
          {showResult && isCorrect && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i: number) => (
                  <Star
                    key={i}
                    className="absolute w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${10 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {type === 'write' && (
            <>
              <span className="text-6xl font-bold text-module-pinyin-foreground mb-4 text-heading">
                {currentQuestion.question}
              </span>
              <span className="text-lg text-module-pinyin-foreground/70">请写出拼音</span>
            </>
          )}
          {type === 'match' && (
            <>
              <span className="text-7xl font-bold text-module-pinyin-foreground text-heading">
                {currentQuestion.question}
              </span>
              <span className="text-lg text-module-pinyin-foreground/70 mt-4">选择正确的汉字</span>
            </>
          )}
          {type === 'tone' && (
            <>
              <span className="text-7xl font-bold text-module-pinyin-foreground text-heading">
                {currentQuestion.question}
              </span>
              <span className="text-lg text-module-pinyin-foreground/70 mt-4">选择正确的声调</span>
            </>
          )}
        </div>

        {/* 选项 / 输入 */}
        {type === 'write' ? (
          <div className="w-full max-w-sm space-y-4">
            <input
              type="text"
              value={writeInput}
              onChange={(e) => setWriteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWriteSubmit()}
              placeholder="输入拼音答案"
              disabled={showResult}
              className="w-full px-6 py-4 text-2xl text-center rounded-2xl border-2 border-border bg-card text-foreground focus:outline-none focus:border-module-pinyin transition-colors disabled:opacity-60"
            />
            {!showResult ? (
              <button
                onClick={handleWriteSubmit}
                disabled={!writeInput.trim()}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                确认答案
              </button>
            ) : (
              <div
                className={`p-4 rounded-2xl text-center font-medium ${
                  isCorrect
                    ? 'bg-success/20 text-success-foreground'
                    : 'bg-destructive/20 text-destructive-foreground'
                }`}
              >
                {isCorrect ? (
                  <span className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 fill-current" /> 答对了！真棒！
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <X className="w-5 h-5" /> 正确答案是：{currentQuestion.answer}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            {currentQuestion.options?.map((option: string, idx: number) => {
              const isSelected = selectedAnswer === option;
              const isAnswer = option === currentQuestion.answer;
              let btnClass = 'bg-card border-2 border-border text-foreground';
              if (showResult) {
                if (isAnswer) {
                  btnClass = 'bg-success/30 border-2 border-success text-success-foreground';
                } else if (isSelected && !isAnswer) {
                  btnClass = 'bg-destructive/30 border-2 border-destructive text-destructive-foreground';
                } else {
                  btnClass = 'bg-card border-2 border-border text-foreground opacity-60';
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  disabled={showResult}
                  className={`py-5 px-4 rounded-2xl font-medium text-lg active:scale-95 transition-all ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* 结果反馈 & 下一题 */}
        {showResult && type !== 'write' && (
          <div className="mt-4 w-full max-w-sm">
            <div
              className={`p-3 rounded-2xl text-center font-medium mb-3 ${
                isCorrect
                  ? 'bg-success/20 text-success-foreground'
                  : 'bg-destructive/20 text-destructive-foreground'
              }`}
            >
              {isCorrect ? (
                <span className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 fill-current" /> 答对了！太棒了！
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5" /> 没关系，再试试！
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部下一题按钮 */}
      {showResult && (
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg active:scale-95 transition-transform shadow-md"
          >
            {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果 🏆'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeMode;
