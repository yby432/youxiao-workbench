import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { ScienceArticle } from '@shared/api.interface';
import { getScienceArticle, submitScienceQuiz } from '@client/src/api/science';

interface ArticleDetailProps {
  articleId: string;
  onBack: () => void;
}

interface QuestionState {
  selected: number | null;
  answered: boolean;
  isCorrect: boolean;
}

const ArticleDetail = ({ articleId, onBack }: ArticleDetailProps) => {
  const [article, setArticle] = useState<ScienceArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getScienceArticle(articleId);
        if (!cancelled) {
          setArticle(data);
          setQuestionStates(
            data.questions.map(() => ({
              selected: null,
              answered: false,
              isCorrect: false,
            })),
          );
        }
      } catch (e) {
        logger.error('加载文章失败', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (!article || questionStates[qIndex]?.answered) return;

    const isCorrect = optIndex === article.questions[qIndex].answer;
    const newStates = [...questionStates];
    newStates[qIndex] = {
      selected: optIndex,
      answered: true,
      isCorrect,
    };
    setQuestionStates(newStates);

    const allAnswered = newStates.every((s) => s.answered);
    if (allAnswered && !submitted) {
      setShowResult(true);
      setSubmitted(true);
      const correctCount = newStates.filter((s) => s.isCorrect).length;
      const allCorrect = correctCount === newStates.length;
      submitScienceQuiz(articleId, allCorrect).catch((e) =>
        logger.error('提交问答结果失败', e),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        文章不存在
      </div>
    );
  }

  const correctCount = questionStates.filter((s) => s.isCorrect).length;
  const totalQuestions = article.questions.length;
  const paragraphs = article.content.split('\n').filter((p) => p.trim());

  return (
    <div className="pb-10">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-primary font-medium"
      >
        <ArrowLeft size={20} />
        返回列表
      </button>

      <div className="rounded-3xl bg-gradient-to-br from-[hsl(145_45%_88%)] to-[hsl(50_45%_88%)] p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-center h-40 mb-4">
          <BookOpen size={64} className="text-[hsl(28_90%_62%)]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center leading-relaxed">
          {article.title}
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {article.imageHint}
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm mb-6 space-y-4">
        {paragraphs.map((para: string, idx: number) => (
          <p
            key={idx}
            className="text-base leading-8 text-foreground"
            style={{ fontFamily: '"Nunito", "PingFang SC", sans-serif' }}
          >
            {para}
          </p>
        ))}
      </div>

      <div className="bg-[hsl(50_45%_92%)] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={22} className="text-[hsl(28_90%_62%)]" />
          <h2 className="text-lg font-bold text-foreground">趣味问答</h2>
        </div>

        <div className="space-y-6">
          {article.questions.map((q, qIdx) => {
            const state = questionStates[qIdx];
            return (
              <div key={qIdx} className="space-y-3">
                <p className="font-semibold text-foreground text-base">
                  {qIdx + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isSelected = state?.selected === oIdx;
                    const isCorrectAnswer = oIdx === q.answer;
                    const showCorrect = state?.answered && isCorrectAnswer;
                    const showWrong =
                      state?.answered && isSelected && !state.isCorrect;

                    let btnClass =
                      'w-full text-left px-5 py-4 rounded-2xl text-base font-medium transition-all ';
                    if (showCorrect) {
                      btnClass +=
                        'bg-[hsl(145_50%_75%)] text-[hsl(145_60%_25%)] border-2 border-[hsl(145_50%_65%)]';
                    } else if (showWrong) {
                      btnClass +=
                        'bg-[hsl(0_60%_85%)] text-[hsl(0_60%_35%)] border-2 border-[hsl(0_60%_70%)]';
                    } else if (state?.answered) {
                      btnClass +=
                        'bg-white/60 text-muted-foreground border-2 border-transparent';
                    } else {
                      btnClass +=
                        'bg-white hover:bg-[hsl(50_45%_96%)] text-foreground border-2 border-transparent hover:border-[hsl(50_45%_75%)] active:scale-[0.98]';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(qIdx, oIdx)}
                        disabled={state?.answered}
                        className={btnClass}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(50_45%_85%)] text-sm font-bold">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          {opt}
                          {showCorrect && (
                            <CheckCircle
                              size={20}
                              className="ml-auto text-[hsl(145_60%_35%)]"
                            />
                          )}
                          {showWrong && (
                            <XCircle
                              size={20}
                              className="ml-auto text-[hsl(0_60%_45%)]"
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {state?.answered && !state.isCorrect && (
                  <p className="text-sm text-[hsl(145_60%_35%)] pl-2">
                    正确答案是：{q.options[q.answer]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 p-5 rounded-2xl bg-white text-center">
            <div className="flex justify-center gap-1 mb-3">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <Star
                  key={i}
                  size={32}
                  fill={i < correctCount ? 'hsl(48 80% 60%)' : 'none'}
                  stroke={i < correctCount ? 'hsl(48 80% 60%)' : 'hsl(220 10% 75%)'}
                />
              ))}
            </div>
            <p className="text-lg font-bold text-foreground">
              答对 {correctCount} / {totalQuestions} 题
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {correctCount === totalQuestions
                ? '太棒了！全部答对啦！🎉'
                : correctCount >= totalQuestions / 2
                  ? '不错哦，继续加油！💪'
                  : '没关系，再读一遍文章试试~'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;
