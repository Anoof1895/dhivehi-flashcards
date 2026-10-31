"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Timer,
  Trophy,
  RotateCcw,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import {
  FlashcardDeckData,
  CardSide,
  getTextDir,
  pickUniqueCards,
} from "@/data/decks";

const MATCH_BEST_KEY = "dhivehi_flashcards_match_best_v1";

interface MatchTile {
  key: string;
  cardId: number;
  side: CardSide;
  text: string;
}

interface MatchGameViewProps {
  deck: FlashcardDeckData;
  onNavigateToFlashcards?: () => void;
  lang?: "en" | "dv";
}

function getSavedBestTime(deckId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MATCH_BEST_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data[deckId] === "number") {
        return data[deckId];
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

function shuffleTiles(tiles: MatchTile[]): MatchTile[] {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createTilesFromDeck(deck: FlashcardDeckData): MatchTile[] {
  const chosen = pickUniqueCards(deck.cards, 6);
  const tiles: MatchTile[] = [];
  for (const card of chosen) {
    tiles.push({
      key: `${card.id}-term`,
      cardId: card.id,
      side: "term",
      text: card.term,
    });
    tiles.push({
      key: `${card.id}-def`,
      cardId: card.id,
      side: "definition",
      text: card.definition,
    });
  }
  return shuffleTiles(tiles);
}

export const MatchGameView: React.FC<MatchGameViewProps> = ({
  deck,
  onNavigateToFlashcards,
  lang = "en",
}) => {
  const [tiles, setTiles] = useState<MatchTile[]>(() => createTilesFromDeck(deck));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [matchedKeys, setMatchedKeys] = useState<Set<string>>(new Set());
  const [wrongKeys, setWrongKeys] = useState<Set<string>>(new Set());

  // Game timer & score
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [penaltySec, setPenaltySec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [bestTimeSec, setBestTimeSec] = useState<number | null>(() => getSavedBestTime(deck.id));
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);

  // Restart / init game
  const handleStartGame = useCallback(() => {
    setTiles(createTilesFromDeck(deck));
    setSelectedKey(null);
    setMatchedKeys(new Set());
    setWrongKeys(new Set());
    setPenaltySec(0);
    setElapsedMs(0);
    setIsFinished(false);
    setIsNewRecord(false);
    setIsPlaying(true);
    startTimeRef.current = 0;
  }, [deck]);

  // Timer loop
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now() - elapsedMs;
    }

    const tick = () => {
      setElapsedMs(performance.now() - startTimeRef.current);
      timerRafRef.current = requestAnimationFrame(tick);
    };

    timerRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
      }
    };
  }, [isPlaying, isFinished, elapsedMs]);

  const handleTileClick = (tile: MatchTile) => {
    if (!isPlaying || isFinished) return;
    if (matchedKeys.has(tile.key)) return;
    if (wrongKeys.size > 0) return;

    if (selectedKey === tile.key) {
      setSelectedKey(null);
      return;
    }

    if (!selectedKey) {
      setSelectedKey(tile.key);
      return;
    }

    const firstTile = tiles.find((t) => t.key === selectedKey);
    if (!firstTile) {
      setSelectedKey(tile.key);
      return;
    }

    // Match success!
    if (firstTile.cardId === tile.cardId && firstTile.side !== tile.side) {
      const nextMatched = new Set(matchedKeys);
      nextMatched.add(firstTile.key);
      nextMatched.add(tile.key);
      setMatchedKeys(nextMatched);
      setSelectedKey(null);

      // Check board cleared
      if (nextMatched.size === tiles.length) {
        setIsFinished(true);
        setIsPlaying(false);

        if (timerRafRef.current) {
          cancelAnimationFrame(timerRafRef.current);
        }

        const totalSec = Math.round(((elapsedMs / 1000) + penaltySec) * 10) / 10;

        try {
          const raw = localStorage.getItem(MATCH_BEST_KEY);
          const records = raw ? JSON.parse(raw) : {};
          const prevBest = records[deck.id];

          if (prevBest === undefined || totalSec < prevBest) {
            records[deck.id] = totalSec;
            localStorage.setItem(MATCH_BEST_KEY, JSON.stringify(records));
            setBestTimeSec(totalSec);
            setIsNewRecord(true);
          }
        } catch {
          // Ignore
        }

        try {
          confetti({
            particleCount: 130,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#6366F1", "#818CF8", "#10B981", "#F59E0B", "#FFFFFF"],
          });
        } catch {
          // Ignore
        }
      }
    } else {
      // Mismatch
      setPenaltySec((prev) => prev + 1);
      setWrongKeys(new Set([firstTile.key, tile.key]));
      setSelectedKey(null);

      setTimeout(() => {
        setWrongKeys(new Set());
      }, 450);
    }
  };

  const currentSeconds = (elapsedMs / 1000 + penaltySec).toFixed(1);
  const matchedPairsCount = Math.floor(matchedKeys.size / 2);
  const totalPairsCount = Math.floor(tiles.length / 2);

  if (deck.cards.length < 2) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl bg-surface border border-line p-8 text-center">
        <AlertCircle className="w-10 h-10 text-warn mx-auto mb-3" />
        <h3 className="font-faruma text-base font-semibold text-fg">
          Add at least 2 cards to this deck to play Match mode.
        </h3>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* ================= STATS & CONTROLS TOOLBAR ================= */}
      <div
        className="w-full mb-4 p-3.5 sm:p-4 rounded-2xl bg-surface border border-line shadow-xl flex flex-wrap items-center justify-between gap-3"
        dir="ltr"
      >
        <div className="flex items-center gap-2.5">
          {/* Live Timer Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-elevated border border-line text-sm font-semibold text-fg">
            <Timer className="w-4 h-4 text-accent" />
            <span className="tabular-nums font-mono text-base">{currentSeconds}s</span>
          </div>

          {/* Matched Pairs Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated border border-line text-xs font-medium text-muted">
            <Zap className="w-3.5 h-3.5 text-accent-soft" />
            <span className="text-fg font-semibold">
              {matchedPairsCount} / {totalPairsCount}
            </span>
            <span>{lang === "dv" ? "ޖޯޑު" : "pairs"}</span>
          </div>

          {/* Penalties Pill */}
          {penaltySec > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold animate-pulse">
              <span>+{penaltySec}s</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {bestTimeSec !== null && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-elevated border border-line text-xs font-medium text-warn"
              title="Best time for this deck"
            >
              <Trophy className="w-3.5 h-3.5 text-warn" />
              <span className="font-mono">{bestTimeSec.toFixed(1)}s</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-xs font-semibold text-fg transition active:scale-95"
            title="Restart Match board"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted" />
            <span>{lang === "dv" ? "އަލުން ފަށާ" : "Restart"}</span>
          </button>
        </div>
      </div>

      {/* ================= VICTORY SCREEN ================= */}
      {isFinished ? (
        <div className="w-full rounded-3xl bg-surface border border-line p-7 sm:p-10 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-accent-glow border border-accent/30 flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-8 h-8 text-accent" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-glow border border-success/30 text-success text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isNewRecord ? "🎉 New Best Record!" : "Board Cleared!"}</span>
            </div>
            <h2 className="font-faruma text-2xl sm:text-3xl font-bold text-fg">
              {lang === "dv" ? "ހުރިހާ ޖޯޑެއް ގުޅުވިއްޖެ!" : "Magnificent Matching!"}
            </h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              You cleared all {totalPairsCount} pairs in{" "}
              <span className="text-fg font-bold font-mono text-base">{currentSeconds}s</span>
              {penaltySec > 0 && (
                <span className="text-danger text-xs ml-1 font-mono">
                  (including +{penaltySec}s penalty)
                </span>
              )}
              {bestTimeSec !== null && !isNewRecord && (
                <span className="block text-xs text-muted-soft mt-1">
                  Personal best: {bestTimeSec.toFixed(1)}s
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartGame}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition shadow-[0_4px_20px_rgba(99,102,241,0.35)] active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{lang === "dv" ? "އަލުން ކުޅޭ" : "Play Again"}</span>
            </button>

            {onNavigateToFlashcards && (
              <button
                type="button"
                onClick={onNavigateToFlashcards}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-elevated hover:bg-elevated-hover border border-line text-fg text-sm font-medium transition active:scale-95"
              >
                <Layers className="w-4 h-4 text-muted" />
                <span>{lang === "dv" ? "ކާޑުތަކަށް އެނބުރިދޭ" : "Study Flashcards"}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ================= 12-TILE MATCH GRID ================= */
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3" dir="ltr">
          {tiles.map((tile) => {
            const isMatched = matchedKeys.has(tile.key);
            const isSelected = selectedKey === tile.key;
            const isWrong = wrongKeys.has(tile.key);
            const textDir = getTextDir(tile.text);

            let tileStyle =
              "bg-surface hover:bg-surface-hover border-line hover:border-line-strong text-fg shadow-lg";

            if (isSelected) {
              tileStyle =
                "bg-accent-glow border-accent ring-2 ring-accent/40 text-fg shadow-[0_0_24px_rgba(99,102,241,0.2)] scale-[1.02]";
            } else if (isWrong) {
              tileStyle =
                "bg-danger/20 border-danger ring-2 ring-danger/40 text-danger animate-bounce";
            } else if (isMatched) {
              tileStyle = "opacity-0 pointer-events-none scale-95 transition-all duration-300";
            }

            return (
              <button
                key={tile.key}
                type="button"
                disabled={isMatched}
                onClick={() => handleTileClick(tile)}
                className={`relative min-h-[110px] sm:min-h-[125px] rounded-2xl border p-3.5 sm:p-4 flex flex-col items-center justify-center text-center transition-all select-none cursor-pointer active:scale-95 ${tileStyle}`}
              >
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-40">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      tile.side === "term" ? "bg-accent" : "bg-warn"
                    }`}
                  />
                </div>

                <span
                  dir={textDir}
                  className={`font-faruma leading-[1.85] break-words line-clamp-4 ${
                    tile.side === "term"
                      ? "text-xl sm:text-2xl font-bold text-fg"
                      : "text-sm sm:text-base font-medium text-fg-soft"
                  } ${textDir === "rtl" ? "text-right" : "text-left"}`}
                >
                  {tile.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Guide hint footer */}
      {!isFinished && (
        <p className="text-center text-xs text-muted mt-5 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-soft" />
          <span>
            {lang === "dv"
              ? "ބަހާއި މާނަ ގުޅުވައިގެން ބޯޑު ހުސްކޮށްލާށެވެ. ނުބައި ޖޯޑަކަށް +1 ސިކުންތު އިތުރުވާނެއެވެ."
              : "Click matching Term and Definition tiles to clear them. Wrong matches add a +1s penalty."}
          </span>
        </p>
      )}
    </div>
  );
};
