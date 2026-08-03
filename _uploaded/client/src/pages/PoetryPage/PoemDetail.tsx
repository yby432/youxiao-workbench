import { useState, useEffect } from 'react';
import {
  BookOpen,
  Star,
  ChevronLeft,
  Volume2,
  PenTool,
  CheckCircle,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Poem, FillBlankQuestion } from '@shared/api.interface';
import {
  getPoemDetail,
  getFillBlankQuestions,
  recitePoem,
  type ReciteResponse,
} from '@client/src/api/poetry';

interface PoemDetailProps {
  poemId: string;
  onBack: () => void;
  onRecited?: (result: ReciteResponse) => void;
}

const PoemDetail = ({ poemId, onBack, onRecited }: PoemDetailProps) => {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showReciteDialog, setShowReciteDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFillBlank, setShowFillBlank] = useState(false);
  const [questions, setQuestions] = useState<FillBlankQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    loadPoem();
  }, [poemId]);

  const loadPoem = async () => {
    try {
      setLoading(true);
      const data = await getPoemDetail(poemId);
      setPoem(data);
    } catch (error) {
      logger.error('加载古诗详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptions = (correctAnswer: string): string[] => {
    const distractors = '春风雨花山水月天明云鸟日夕阳柳江南梅竹松荷菊兰';
    const chars = Array.from(distractors).filter((c: string) => c !== correctAnswer);
    const shuffled = chars.sort(() => Math.random() - 0.5).slice(0, 3);
    const all = [...shuffled, correctAnswer].sort(() => Math.random() - 0.5);
    return all;
  };

  const startFillBlank = async () => {
    try {
      const data = await getFillBlankQuestions(poemId);
      if (data.questions.length === 0) return;
      setQuestions(data.questions);
      setCurrentQIndex(0);
      setScore(0);
      setQuizFinished(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setOptions(generateOptions(data.questions[0].answer));
      setShowFillBlank(true);
    } catch (error) {
      logger.error('加载填空题失败', error);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    const current = questions[currentQIndex];
    const correct = answer === current.answer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    if (correct) {
      setScore((prev: number) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setOptions(generateOptions(questions[nextIndex].answer));
    } else {
      setQuizFinished(true);
    }
  };

  const handleRecite = async () => {
    try {
      const result = await recitePoem(poemId);
      setShowReciteDialog(false);
      setShowSuccess(true);
      onRecited?.(result);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      logger.error('背诵打卡失败', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">暂无数据</div>
      </div>
    );
  }

  // 填空练习视图
  if (showFillBlank && questions.length > 0) {
    const currentQ = questions[currentQIndex];
    const lineText = poem.content[currentQ.lineIndex] || '';

    return (
      <div className="min-h-screen bg-background">
        {/* 顶部栏 */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-border">
          <button
            onClick={() => setShowFillBlank(false)}
            className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h2 className="text-lg font-heading text-foreground">诗句填空</h2>
          <div className="ml-auto text-sm text-muted-foreground">
            {currentQIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="p-5 safe-bottom">
          {!quizFinished ? (
            <>
              {/* 进度条 */}
              <div className="w-full h-2 bg-muted rounded-full mb-8 overflow-hidden">
                <div
                  className="h-full bg-module-poetry rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* 题目卡片 */}
              <div className="bg-card rounded-2xl p-6 shadow-sm mb-8">
                <div className="text-center mb-2 text-sm text-muted-foreground">
                  第 {currentQIndex + 1} 题
                </div>
                <div className="text-center text-2xl font-heading text-foreground leading-relaxed tracking-wider">
                  {currentQ.hint}
                </div>
              </div>

              {/* 选项 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {options.map((opt: string, idx: number) => {
                  const isSelected = selectedAnswer === opt;
                  const isAnswer = opt === currentQ.answer;
                  let btnClass = 'bg-card border-2 border-border text-foreground hover:border-module-poetry hover:bg-accent';
                  if (selectedAnswer !== null) {
                    if (isAnswer) {
                      btnClass = 'bg-success/20 border-2 border-success text-success-foreground';
                    } else if (isSelected && !isCorrect) {
                      btnClass = 'bg-destructive/20 border-2 border-destructive text-destructive-foreground';
                    } else {
                      btnClass = 'bg-card border-2 border-border text-muted-foreground opacity-50';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(opt)}
                      disabled={selectedAnswer !== null}
                      className={`h-16 rounded-2xl text-2xl font-heading transition-all duration-200 active:scale-95 ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* 反馈 */}
              {selectedAnswer !== null && (
                <div
                  className={`rounded-2xl p-4 mb-6 ${
                    isCorrect
                      ? 'bg-success/15 text-success-foreground'
                      : 'bg-destructive/15 text-destructive-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                    <span className="font-heading text-lg">
                      {isCorrect ? '答对啦！真棒~' : '再想想哦~'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="text-sm opacity-80">
                      正确答案是：<span className="font-bold">{currentQ.answer}</span>
                    </div>
                  )}
                  <div className="text-sm opacity-70 mt-1">
                    原句：{lineText}
                  </div>
                </div>
              )}

              {/* 下一题按钮 */}
              {selectedAnswer !== null && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full h-14 bg-primary text-primary-foreground rounded-full font-heading text-lg shadow-sm active:scale-[0.98] transition-transform"
                >
                  {currentQIndex < questions.length - 1 ? '下一题' : '查看得分'}
                </button>
              )}
            </>
          ) : (
            /* 得分结果 */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-32 h-32 rounded-full bg-module-poetry/30 flex items-center justify-center mb-6">
                <Trophy className="w-16 h-16 text-module-poetry-foreground" />
              </div>
              <h3 className="text-2xl font-heading text-foreground mb-2">
                练习完成！
              </h3>
              <div className="text-4xl font-heading text-primary mb-2">
                {score} / {questions.length}
              </div>
              <p className="text-muted-foreground mb-8">
                {score === questions.length
                  ? '全部答对啦，太厉害了！🌟'
                  : score >= questions.length / 2
                  ? '不错哦，继续加油~'
                  : '再多读几遍古诗吧！'}
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={startFillBlank}
                  className="flex-1 h-12 bg-accent text-accent-foreground rounded-full font-heading flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <RotateCcw className="w-5 h-5" />
                  再来一次
                </button>
                <button
                  onClick={() => setShowFillBlank(false)}
                  className="flex-1 h-12 bg-primary text-primary-foreground rounded-full font-heading active:scale-[0.98] transition-transform"
                >
                  返回详情
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 详情页视图
  return (
    <div className="min-h-screen bg-background">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h2 className="text-lg font-heading text-foreground">{poem.title}</h2>
      </div>

      <div className="p-5 safe-bottom">
        {/* 诗文卡片 */}
        <div className="bg-gradient-to-br from-module-poetry/40 to-card rounded-2xl p-6 shadow-sm mb-5">
          <h1 className="text-2xl font-heading text-center text-foreground mb-1">
            {poem.title}
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-6">
            【{poem.difficulty === 1 ? '一' : poem.difficulty === 2 ? '二' : '三'}星难度】{poem.author}
          </p>

          {/* 诗句带拼音 */}
          <div className="space-y-5">
            {poem.content.map((line: string, idx: number) => (
              <div key={idx} className="text-center">
                {/* 拼音行 */}
                <div className="text-xs text-muted-foreground mb-1 tracking-wider font-mono">
                  {poem.pinyinContent[idx] || ''}
                </div>
                {/* 诗句 */}
                <div className="text-2xl font-heading text-foreground tracking-[0.3em] leading-relaxed">
                  {line}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 译文 */}
        <div className="bg-card rounded-2xl shadow-sm mb-5 overflow-hidden">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="w-full px-5 py-4 flex items-center justify-between text-left"
          >
            <span className="font-heading text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-module-poetry-foreground" />
              译文释义
            </span>
            {showTranslation ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {showTranslation && (
            <div className="px-5 pb-5 text-foreground/80 leading-relaxed text-sm border-t border-border pt-4">
              {poem.translation}
            </div>
          )}
        </div>

        {/* 图文释义 */}
        <div className="bg-card rounded-2xl p-5 shadow-sm mb-5">
          <div className="font-heading text-foreground flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-module-poetry-foreground" />
            诗中意境
          </div>
          <div className="aspect-video bg-module-poetry/20 rounded-xl flex items-center justify-center mb-4">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-module-poetry-foreground/50 mx-auto mb-2" />
              <div className="text-xs text-module-poetry-foreground/70">
                古诗插画
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            {poem.illustration}
          </p>
        </div>

        {/* 底部操作按钮 */}
        <div className="space-y-3">
          <button
            className="w-full h-14 bg-accent text-accent-foreground rounded-full font-heading text-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            <Volume2 className="w-5 h-5" />
            跟读朗诵
          </button>
          <button
            onClick={startFillBlank}
            className="w-full h-14 bg-module-poetry text-module-poetry-foreground rounded-full font-heading text-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            <PenTool className="w-5 h-5" />
            诗句填空
          </button>
          <button
            onClick={() => setShowReciteDialog(true)}
            className="w-full h-14 bg-primary text-primary-foreground rounded-full font-heading text-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            <CheckCircle className="w-5 h-5" />
            背诵打卡
          </button>
        </div>
      </div>

      {/* 背诵确认弹窗 */}
      {showReciteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-heading text-foreground text-center mb-2">
              背诵打卡
            </h3>
            <p className="text-center text-muted-foreground mb-6">
              你已经会背《{poem.title}》了吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReciteDialog(false)}
                className="flex-1 h-12 bg-muted text-muted-foreground rounded-full font-heading active:scale-[0.98] transition-transform"
              >
                再想想
              </button>
              <button
                onClick={handleRecite}
                className="flex-1 h-12 bg-primary text-primary-foreground rounded-full font-heading active:scale-[0.98] transition-transform"
              >
                确认打卡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成功动画 */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="animate-bounce">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full border-4 border-destructive/80 flex items-center justify-center bg-card/90">
                <div className="text-center">
                  <div className="text-3xl font-heading text-destructive mb-1">
                    已背
                  </div>
                  <div className="text-sm text-destructive/70">
                    打卡成功
                  </div>
                </div>
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-warning" />
              <Sparkles className="absolute -bottom-1 -left-2 w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoemDetail;
