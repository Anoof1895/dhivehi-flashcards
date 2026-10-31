"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Flame,
  Target,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeftRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  FlashcardDeckData,
  FlashcardItem,
  CardSide,
  getTextDir,
} from "@/data/decks";

interface LearnQuizViewProps {
  deck: FlashcardDeckData;
  memorized: Set<number>;
  onToggleMemorized: (id: number) => void;
  lang?: "en" | "dv";
}

interface QuizQuestion {
  card: FlashcardItem;
  promptText: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuestionsRound(
  subset: FlashcardItem[],
  allDeckCards: FlashcardItem[],
  questionSide: CardSide
): QuizQuestion[] {
  return shuffleArray(subset).map((card) => {
    const promptText = questionSide === "term" ? card.term : card.definition;
    const correctAnswer = questionSide === "term" ? card.definition : card.term;

    const candidateDistractors: string[] = [];
    const seenAnswers = new Set<string>([correctAnswer.trim()]);

    for (const other of shuffleArray(allDeckCards)) {
      const otherPrompt = questionSide === "term" ? other.term : other.definition;
      const otherAnswer = questionSide === "term" ? other.definition : other.term;
      if (other.id === card.id) continue;
      if (otherPrompt.trim() === promptText.trim()) continue;
      if (seenAnswers.has(otherAnswer.trim())) continue;

      seenAnswers.add(otherAnswer.trim());
      candidateDistractors.push(otherAnswer);
      if (candidateDistractors.length === 3) break;
    }

    const options = shuffleArray([correctAnswer, ...candidateDistractors]);
    const correctIndex = options.findIndex((o) => o === correctAnswer);

    return {
      card,
      promptText,
      correctAnswer,
      options,
      correctIndex,
    };
  });
}

export const LearnQuizView: React.FC<LearnQuizViewProps> = ({
  deck,
  memorized,
  onToggleMemorized,
  lang = "en",
}) => {
  const [questionSide, setQuestionSide] = useState<CardSide>("term");
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    buildQuestionsRound(deck.cards, deck.cards, "term")
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [missedCards, setMissedCards] = useState<FlashcardItem[]>([]);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [isRetryRound, setIsRetryRound] = useState<boolean>(false);

  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAutoTimer();
  }, [clearAutoTimer]);

  const startNewRound = useCallback(
    (subset?: FlashcardItem[], retryMode: boolean = false, sideOverride?: CardSide) => {
      clearAutoTimer();
      const side = sideOverride ?? questionSide;
      const source = subset && subset.length > 0 ? subset : deck.cards;
      setQuestions(buildQuestionsRound(source, deck.cards, side));
      setCurrentIdx(0);
      setSelectedIdx(null);
      if (!retryMode) {
        setStreak(0);
        setBestStreak(0);
      }
      setCorrectCount(0);
      setAnsweredCount(0);
      setMissedCards([]);
      setIsRoundFinished(false);
      setIsRetryRound(retryMode);
    },
    [deck.cards, questionSide, clearAutoTimer]
  );

  const handleToggleQuestionSide = () => {
    const nextSide: CardSide = questionSide === "term" ? "definition" : "term";
    setQuestionSide(nextSide);
    startNewRound(deck.cards, false, nextSide);
  };

  const currentQuestion = questions[currentIdx] ?? null;

  const advanceToNext = useCallback(() => {
    clearAutoTimer();
    if (currentIdx + 1 >= questions.length) {
      setIsRoundFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedIdx(null);
    }
  }, [currentIdx, questions.length, clearAutoTimer]);

  const handleSelectOption = useCallback(
    (optIdx: number) => {
      if (!currentQuestion || selectedIdx !== null || isRoundFinished) return;
      if (optIdx < 0 || optIdx >= currentQuestion.options.length) return;

      setSelectedIdx(optIdx);
      setAnsweredCount((c) => c + 1);

      const isCorrect = optIdx === currentQuestion.correctIndex;
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });

        if (autoAdvance) {
          autoAdvanceTimerRef.current = setTimeout(() => {
            advanceToNext();
          }, 850);
        }
      } else {
        setStreak(0);
        setMissedCards((prev) =>
          prev.some((m) => m.id === currentQuestion.card.id)
            ? prev
            : [...prev, currentQuestion.card]
        );
      }
    },
    [currentQuestion, selectedIdx, isRoundFinished, autoAdvance, advanceToNext]
  );

  // Confetti when finishing round with 100% accuracy
  useEffect(() => {
    if (isRoundFinished && answeredCount > 0 && missedCards.length === 0) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#6366F1", "#818CF8", "#10B981", "#FFFFFF"],
        });
      } catch {
        // Ignore
      }
    }
  }, [isRoundFinished, answeredCount, missedCards.length]);

  // Keyboard shortcuts: 1, 2, 3, 4 to pick an option; Space / Enter / ArrowRight to continue
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (isRoundFinished) return;

      if (selectedIdx === null) {
        if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
          const idx = parseInt(e.key, 10) - 1;
          if (currentQuestion && idx < currentQuestion.options.length) {
            e.preventDefault();
            handleSelectOption(idx);
          }
        }
      } else {
        if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
          e.preventDefault();
          advanceToNext();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRoundFinished, selectedIdx, currentQuestion, handleSelectOption, advanceToNext]);

  const accuracyPercent =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 100;

  const progressPercent =
    questions.length > 0
      ? Math.round(
          ((isRoundFinished ? questions.length : currentIdx) / questions.length) *
            100
        )
      : 0;

  if (deck.cards.length < 2) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl bg-surface border border-line p-8 text-center">
        <AlertCircle className="w-10 h-10 text-warn mx-auto mb-3" />
        <h3 className="font-faruma text-base font-semibold text-fg">
          Add at least 2 cards to this deck to play Learn / Quiz mode.
        </h3>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* ================= TOP STATS & QUIZ SETTINGS BAR ================= */}
      <div
        className="w-full mb-4 p-3.5 sm:p-4 rounded-2xl bg-surface border border-line shadow-xl flex flex-wrap items-center justify-between gap-3"
        dir="ltr"
      >
        <div className="flex items-center gap-2">
          {/* Streak */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              streak > 0
                ? "bg-warn/15 border-warn/35 text-warn"
                : "bg-elevated border-line text-muted"
            }`}
            title={`Best Streak: ${bestStreak}`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                streak > 0 ? "text-warn fill-warn" : "text-muted"
              }`}
            />
            <span className="tabular-nums">
              {lang === "dv" ? `ސްޓްރީކް: ${streak}` : `Streak: ${streak}`}
            </span>
          </div>

          {/* Accuracy */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated border border-line text-xs font-semibold text-accent-soft">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span className="tabular-nums">
              {answeredCount > 0
                ? `${accuracyPercent}% (${correctCount}/${answeredCount})`
                : lang === "dv"
                ? "ޞައްޙަކަން: —"
                : "Accuracy: —"}
            </span>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleQuestionSide}
            className="font-faruma flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-xs font-medium text-fg transition"
            title="Switch Question & Answer sides"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-accent" />
            <span>
              {questionSide === "term"
                ? lang === "dv"
                  ? "ސުވާލު: ބަސް"
                  : "Answer w/ Def"
                : lang === "dv"
                ? "ސުވާލު: މާނަ"
                : "Answer w/ Term"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAutoAdvance((prev) => !prev)}
            className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition ${
              autoAdvance
                ? "bg-accent/15 border-accent/40 text-accent-soft"
                : "bg-elevated border-line text-muted"
            }`}
            title="Automatically advance after a correct answer"
          >
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Auto-Next</span>
          </button>
        </div>
      </div>

      {/* ================= ROUND PROGRESS BAR ================= */}
      <div className="w-full mb-4 px-1" dir="ltr">
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span className="tabular-nums font-medium">
            {isRoundFinished
              ? `Completed ${questions.length} of ${questions.length}`
              : `${isRetryRound ? "Retry Round • " : ""}Question ${currentIdx + 1} of ${
                  questions.length
                }`}
          </span>
          {missedCards.length > 0 && !isRoundFinished && (
            <span className="text-danger text-[11px] font-medium">
              {missedCards.length} to review
            </span>
          )}
        </div>
        <div className="w-full h-1.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-soft transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ================= END OF ROUND SUMMARY ================= */}
      {isRoundFinished ? (
        <div className="w-full rounded-3xl bg-surface border border-line p-7 sm:p-10 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-accent-glow border border-accent/30 flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-8 h-8 text-accent" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-faruma text-2xl sm:text-3xl font-bold text-fg">
              {missedCards.length === 0
                ? lang === "dv"
                  ? "މަރުޙަބާ! ހުރިހާ ސުވާލެއް ރަނގަޅު!"
                  : "Flawless Round! 100% Accuracy"
                : lang === "dv"
                ? "ބުރު ނިމިއްޖެ!"
                : "Round Complete!"}
            </h2>
            <p className="text-sm text-muted">
              You answered{" "}
              <span className="text-fg font-bold font-mono">{correctCount}</span> out of{" "}
              <span className="text-fg font-bold font-mono">{answeredCount}</span>{" "}
              correctly ({accuracyPercent}%) • Best streak:{" "}
              <span className="text-warn font-bold font-mono">{bestStreak}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {missedCards.length > 0 && (
              <button
                type="button"
                onClick={() => startNewRound(missedCards, true)}
                className="font-faruma flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition shadow-[0_4px_20px_rgba(99,102,241,0.35)] active:scale-95"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.3]" />
                <span>
                  {lang === "dv"
                    ? `ނުބައިވި ކާޑުތައް އަލުން ހަދާ (${missedCards.length})`
                    : `Retry Missed Cards (${missedCards.length})`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => startNewRound(deck.cards, false)}
              className="font-faruma flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-elevated hover:bg-elevated-hover border border-line text-fg font-semibold text-sm transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-muted" />
              <span>
                {lang === "dv"
                  ? `ހުރިހާ ކާޑުތަކުން އާ ބުރެއް (${deck.cards.length})`
                  : `New Full Round (${deck.cards.length})`}
              </span>
            </button>
          </div>

          {/* Missed Cards Review List */}
          {missedCards.length > 0 && (
            <div className="space-y-2.5 pt-4 border-t border-line text-left">
              <h3 className="text-xs uppercase tracking-wider text-danger font-semibold">
                Missed Cards to Review ({missedCards.length})
              </h3>
              <div className="max-h-64 overflow-y-auto rounded-2xl bg-elevated border border-line divide-y divide-line">
                {missedCards.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div
                      dir={getTextDir(c.term)}
                      className="font-faruma font-bold text-base text-fg"
                    >
                      {c.term}
                    </div>
                    <div
                      dir={getTextDir(c.definition)}
                      className="font-faruma text-sm text-fg-soft"
                    >
                      {c.definition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= ACTIVE QUIZ CARD & 4 OPTIONS ================= */
        currentQuestion && (
          <div className="w-full space-y-4">
            {/* Prompt Card */}
            <div className="relative w-full min-h-[200px] sm:min-h-[220px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-surface border border-line shadow-2xl">
              <div className="relative z-10 flex items-center justify-between text-xs text-muted" dir="ltr">
                <span className="font-mono text-accent-soft font-semibold">
                  #{String(currentQuestion.card.id).padStart(2, "0")} •{" "}
                  {questionSide === "term" ? "Term" : "Definition"}
                </span>

                <button
                  type="button"
                  onClick={() => onToggleMemorized(currentQuestion.card.id)}
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition ${
                    memorized.has(currentQuestion.card.id)
                      ? "bg-success/15 border-success/35 text-success"
                      : "bg-elevated border-line text-muted hover:text-fg"
                  }`}
                >
                  {memorized.has(currentQuestion.card.id) ? "✓ Mastered" : "Mark Mastered"}
                </button>
              </div>

              <div className="relative z-10 my-auto py-4 text-center">
                <h2
                  dir={getTextDir(currentQuestion.promptText)}
                  className={`font-faruma ${
                    questionSide === "term"
                      ? "text-4xl sm:text-5xl font-bold leading-[1.8]"
                      : "text-2xl sm:text-3xl font-semibold leading-[2.0]"
                  } text-fg px-4 select-text break-words`}
                >
                  {currentQuestion.promptText}
                </h2>
              </div>

              <div className="relative z-10 text-center text-xs text-muted" dir="ltr">
                {lang === "dv"
                  ? "ރަނގަޅު ޖަވާބު ޚިޔާރުކުރައްވާ (ކީބޯޑުން 1–4)"
                  : "Choose the matching answer below (or press keys 1 – 4)"}
              </div>
            </div>

            {/* 4 Multiple Choice Options (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
              {currentQuestion.options.map((opt, idx) => {
                const isAnswered = selectedIdx !== null;
                const isSelected = selectedIdx === idx;
                const isCorrectOpt = idx === currentQuestion.correctIndex;
                const optDir = getTextDir(opt);

                let cardStyle =
                  "bg-surface hover:bg-surface-hover border-line hover:border-line-strong text-fg-soft shadow-md";
                let badgeStyle =
                  "bg-elevated border-line text-accent font-semibold";

                if (isAnswered) {
                  if (isCorrectOpt) {
                    cardStyle =
                      "bg-success-glow border-success text-success shadow-[0_0_24px_rgba(16,185,129,0.18)]";
                    badgeStyle =
                      "bg-success/25 border-success/50 text-success";
                  } else if (isSelected && !isCorrectOpt) {
                    cardStyle =
                      "bg-danger/15 border-danger text-danger shadow-[0_0_24px_rgba(244,63,94,0.18)]";
                    badgeStyle =
                      "bg-danger/25 border-danger/50 text-danger";
                  } else {
                    cardStyle =
                      "bg-surface border-line text-muted/40 opacity-50";
                    badgeStyle = "bg-elevated border-line text-muted-soft";
                  }
                }

                return (
                  <button
                    key={`${currentQuestion.card.id}-opt-${idx}`}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`group relative rounded-2xl border p-4 text-left transition-all flex items-start gap-3 min-h-[84px] ${cardStyle} ${
                      !isAnswered ? "active:scale-[0.99] cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg border font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 transition ${badgeStyle}`}
                    >
                      {idx + 1}
                    </span>

                    <span
                      dir={optDir}
                      className={`flex-1 font-faruma text-base sm:text-lg leading-[1.9] break-words ${
                        optDir === "rtl" ? "text-right" : "text-left"
                      }`}
                    >
                      {opt}
                    </span>

                    {isAnswered && isCorrectOpt && (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-1" />
                    )}
                    {isAnswered && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 text-danger shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Banner & Continue Button */}
            {selectedIdx !== null && (
              <div
                className={`w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                  selectedIdx === currentQuestion.correctIndex
                    ? "bg-success-glow border-success text-success"
                    : "bg-danger/10 border-danger/30 text-danger"
                }`}
                dir="ltr"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  {selectedIdx === currentQuestion.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>
                        {lang === "dv"
                          ? "ރަނގަޅު ޖަވާބު! ޢާޝާ!"
                          : "Correct! Nice job."}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-danger shrink-0" />
                      <span>
                        {lang === "dv"
                          ? "ރަނގަޅު ޖަވާބު ފެހިކުލައިން ފާހަގަކުރެވިފައި."
                          : "Review the highlighted green answer before continuing."}
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={advanceToNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-fg text-xs font-semibold whitespace-nowrap transition active:scale-95"
                >
                  <span>
                    {currentIdx + 1 >= questions.length ? "See Results" : "Continue"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Shortcuts Guide Hint */}
            <div className="hidden md:flex items-center justify-center gap-4 pt-1 text-[11px] text-muted opacity-60">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">
                  1
                </kbd>{" "}
                –{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">
                  4
                </kbd>{" "}
                Select option
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">
                  Space
                </kbd>{" "}
                /{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">
                  Enter
                </kbd>{" "}
                Continue
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
};
