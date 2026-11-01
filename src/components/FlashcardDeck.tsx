"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  BookOpen,
  ArrowLeftRight,
  Plus,
} from "lucide-react";
import { FlashcardDeckData, FlashcardItem, CardSide } from "@/data/decks";
import { Flashcard3D } from "./Flashcard3D";

type DeckFilter = "all" | "learning" | "memorized" | "favorites";

interface FlashcardDeckProps {
  deck: FlashcardDeckData;
  frontSide: CardSide;
  onToggleFrontSide: () => void;
  memorized: Set<number>;
  favorites: Set<number>;
  onToggleMemorized: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onEditCard?: (card: FlashcardItem) => void;
  onAddCard?: () => void;
  initialCardId?: number;
  lang?: "en" | "dv";
}

function createShuffledIds(cards: FlashcardItem[]): number[] {
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  deck,
  frontSide,
  onToggleFrontSide,
  memorized,
  favorites,
  onToggleMemorized,
  onToggleFavorite,
  onEditCard,
  onAddCard,
  initialCardId,
  lang = "en",
}) => {
  const cards = deck.cards;

  const [filter, setFilter] = useState<DeckFilter>("all");
  const [shuffledIds, setShuffledIds] = useState<number[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialCardId !== undefined) {
      const idx = cards.findIndex((c) => c.id === initialCardId);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const prevMemorizedCount = useRef<number>(memorized.size);

  const isShuffled = shuffledIds !== null;

  // Filter and order cards without calling Math.random during render
  const filteredCards = useMemo(() => {
    const orderedBase: FlashcardItem[] = shuffledIds
      ? shuffledIds
          .map((id) => cards.find((c) => c.id === id))
          .filter((c): c is FlashcardItem => Boolean(c))
      : cards;

    switch (filter) {
      case "learning":
        return orderedBase.filter((c) => !memorized.has(c.id));
      case "memorized":
        return orderedBase.filter((c) => memorized.has(c.id));
      case "favorites":
        return orderedBase.filter((c) => favorites.has(c.id));
      case "all":
      default:
        return orderedBase;
    }
  }, [cards, shuffledIds, filter, memorized, favorites]);

  const safeIndex =
    filteredCards.length > 0
      ? Math.min(currentIndex, filteredCards.length - 1)
      : 0;

  const currentCard = filteredCards[safeIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setShuffledIds((prev) => (prev === null ? createShuffledIds(cards) : null));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  const handleSwitchFrontSide = useCallback(() => {
    setIsFlipped(false);
    onToggleFrontSide();
  }, [onToggleFrontSide]);

  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setSlideDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => {
      const clamped = Math.min(prev, filteredCards.length - 1);
      return (clamped + 1) % filteredCards.length;
    });
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setSlideDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => {
      const clamped = Math.min(prev, filteredCards.length - 1);
      return (clamped - 1 + filteredCards.length) % filteredCards.length;
    });
  }, [filteredCards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          handleFlip();
          break;
        case "m":
        case "M":
          if (currentCard) {
            e.preventDefault();
            onToggleMemorized(currentCard.id);
          }
          break;
        case "f":
        case "F":
          if (currentCard) {
            e.preventDefault();
            onToggleFavorite(currentCard.id);
          }
          break;
        case "s":
        case "S":
          e.preventDefault();
          handleToggleShuffle();
          break;
        case "t":
        case "T":
          e.preventDefault();
          handleSwitchFrontSide();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleNext,
    handlePrev,
    handleFlip,
    currentCard,
    onToggleMemorized,
    onToggleFavorite,
    handleToggleShuffle,
    handleSwitchFrontSide,
  ]);

  // Celebratory confetti when completing 100% of active deck
  useEffect(() => {
    if (
      cards.length > 0 &&
      memorized.size === cards.length &&
      prevMemorizedCount.current < cards.length
    ) {
      try {
        confetti({
          particleCount: 130,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#6366F1", "#818CF8", "#10B981", "#FFFFFF"],
        });
      } catch {
        // Ignore
      }
    }
    prevMemorizedCount.current = memorized.size;
  }, [memorized.size, cards.length]);

  const progressPercent =
    filteredCards.length > 0
      ? Math.round(((safeIndex + 1) / filteredCards.length) * 100)
      : 0;

  const totalMemorizedPercent =
    cards.length > 0 ? Math.round((memorized.size / cards.length) * 100) : 0;

  return (
    <div className="w-full max-w-3xl flex flex-col items-center mx-auto">
      {/* ================= Single-Row Toolbar (Filters + Side Toggle + Shuffle) ================= */}
      <div
        className="w-full mb-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-0.5"
        dir="ltr"
      >
        {/* Segmented Filter Track */}
        <div className="flex items-center p-1 rounded-xl bg-surface border border-line shadow-sm overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === "all"
                ? "bg-accent/15 text-accent-soft border border-accent/30 shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {lang === "dv" ? `ހުރިހާ (${cards.length})` : `All (${cards.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("learning");
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === "learning"
                ? "bg-accent/15 text-accent-soft border border-accent/30 shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {lang === "dv"
              ? `ދަސްކުރަން (${Math.max(0, cards.length - memorized.size)})`
              : `Learning (${Math.max(0, cards.length - memorized.size)})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("memorized");
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === "memorized"
                ? "bg-success/15 text-success border border-success/30 shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {lang === "dv" ? `ހިތުދަސް (${memorized.size})` : `Memorized (${memorized.size})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("favorites");
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === "favorites"
                ? "bg-warn/15 text-warn border border-warn/30 shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {lang === "dv" ? `ފޭވަރިޓް (${favorites.size})` : `Favorites (${favorites.size})`}
          </button>
        </div>

        {/* Right Tools: Front Side (Term ⇄ Def) + Shuffle */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={handleSwitchFrontSide}
            className={`font-faruma flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              frontSide === "definition"
                ? "bg-accent/15 border-accent/40 text-accent-soft"
                : "bg-surface border-line text-muted hover:text-fg hover:border-line-strong"
            }`}
            title="Toggle Front Side: Term ↔ Definition (Shortcut: T)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-accent" />
            <span>
              {lang === "dv"
                ? `ކުރިމަތި: ${frontSide === "term" ? "ބަސް" : "މާނަ"}`
                : `Front: ${frontSide === "term" ? "Term" : "Def"}`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleShuffle}
            className={`font-faruma flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isShuffled
                ? "bg-accent/15 border border-accent/40 text-accent-soft"
                : "bg-surface border border-line text-muted hover:text-fg hover:border-line-strong"
            }`}
            title="Toggle Shuffle (Shortcut: S)"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{lang === "dv" ? "އޮޅުވާލާ" : "Shuffle"}</span>
          </button>

          {onAddCard && (
            <button
              type="button"
              onClick={onAddCard}
              className="font-faruma flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-surface border border-line text-muted hover:text-fg hover:border-line-strong active:scale-95"
              title="Add a new card to this deck"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">
                {lang === "dv" ? "އާ ކާޑެއް" : "Add Card"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ================= Progress Bar ================= */}
      <div className="w-full mb-4 px-1" dir="ltr">
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span className="font-sans tabular-nums font-medium">
            {lang === "dv"
              ? `${filteredCards.length > 0 ? safeIndex + 1 : 0} / ${filteredCards.length}`
              : `${filteredCards.length > 0 ? safeIndex + 1 : 0} of ${filteredCards.length}`}
          </span>
          <span className="font-sans text-accent-soft font-semibold tracking-tight">
            {lang === "dv"
              ? `ހިތުދަސްވެފައި ${totalMemorizedPercent}% (${memorized.size}/${cards.length})`
              : `${totalMemorizedPercent}% Mastered (${memorized.size}/${cards.length})`}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-soft transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ================= Active Flashcard Container (768px max-w-3xl) ================= */}
      <div className="relative w-full h-[380px] sm:h-[420px] mx-auto">
        {filteredCards.length > 0 && currentCard ? (
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={`${deck.id}-${currentCard.id}`}
              custom={slideDirection}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? 35 : -35,
                  opacity: 0,
                  scale: 0.98,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  transition: {
                    x: { type: "spring", stiffness: 320, damping: 28 },
                    opacity: { duration: 0.2 },
                  },
                },
                exit: (dir: number) => ({
                  x: dir > 0 ? -35 : 35,
                  opacity: 0,
                  scale: 0.98,
                  transition: {
                    x: { type: "spring", stiffness: 320, damping: 28 },
                    opacity: { duration: 0.15 },
                  },
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <Flashcard3D
                card={currentCard}
                frontSide={frontSide}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                isMemorized={memorized.has(currentCard.id)}
                isFavorite={favorites.has(currentCard.id)}
                onToggleMemorized={() => onToggleMemorized(currentCard.id)}
                onToggleFavorite={() => onToggleFavorite(currentCard.id)}
                onEditCard={onEditCard}
                onSwipeLeft={handleNext}
                onSwipeRight={handlePrev}
                cardIndex={safeIndex}
                totalCards={filteredCards.length}
                lang={lang}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full rounded-3xl border border-line bg-surface flex flex-col items-center justify-center p-8 text-center text-muted">
            <BookOpen className="w-10 h-10 text-muted-soft mb-3" />
            <h3 className="font-faruma text-base font-semibold text-fg mb-1">
              {lang === "dv" ? "މި ލިސްޓުގައި އެއްވެސް ކާޑެއް ނެތް" : "No cards in this filter"}
            </h3>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="font-faruma mt-4 px-4 py-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-accent-soft text-xs font-medium transition"
              >
                {lang === "dv" ? `ހުރިހާ ކާޑުތައް ދައްކާ (${cards.length})` : `Show All ${cards.length} Cards`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================= Mobile Swipe Hint ================= */}
      <div className="text-center sm:hidden text-xs text-muted/80 flex items-center justify-center gap-2 my-3" dir="ltr">
        <span>←</span>
        <span dir={lang === "dv" ? "rtl" : "ltr"}>
          {lang === "dv" ? "ބަދަލުކުރުމަށް ދަމާލާ" : "Swipe to navigate"}
        </span>
        <span>→</span>
      </div>

      {/* ================= Deck Navigation Buttons (Wide & High Impact) ================= */}
      <div className="w-full mt-3 sm:mt-6 flex items-center justify-between gap-3" dir="ltr">
        <button
          type="button"
          onClick={handlePrev}
          disabled={filteredCards.length <= 1}
          className="flex-1 py-3 px-4 rounded-2xl bg-surface hover:bg-surface-hover border border-line hover:border-line-strong text-muted hover:text-fg active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-sm"
          title="Previous Card (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4 text-muted shrink-0" />
          <span dir={lang === "dv" ? "rtl" : "ltr"}>{lang === "dv" ? "ކުރީގެ" : "Previous"}</span>
        </button>

        <button
          type="button"
          onClick={handleFlip}
          disabled={filteredCards.length === 0}
          className="flex-1 py-3 px-4 rounded-2xl bg-accent hover:bg-accent/90 text-white active:scale-95 font-semibold text-xs sm:text-sm transition shadow-[0_4px_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
          title="Flip Card (Space / Enter)"
        >
          <RotateCw className="w-4 h-4 shrink-0" />
          <span dir={lang === "dv" ? "rtl" : "ltr"}>{lang === "dv" ? "ފުށުންޖަހާ" : "Flip Card"}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={filteredCards.length <= 1}
          className="flex-1 py-3 px-4 rounded-2xl bg-surface hover:bg-surface-hover border border-line hover:border-line-strong text-muted hover:text-fg active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-sm"
          title="Next Card (Right Arrow)"
        >
          <span dir={lang === "dv" ? "rtl" : "ltr"}>{lang === "dv" ? "ދެންއޮތް" : "Next"}</span>
          <ChevronRight className="w-4 h-4 text-muted shrink-0" />
        </button>
      </div>

      {/* ================= Keyboard Shortcuts Row ================= */}
      <div className="hidden md:flex items-center justify-center flex-wrap gap-4 mt-6 text-[11px] text-muted opacity-60 hover:opacity-100 transition-opacity">
        <span className="font-faruma">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">Space</kbd>{" "}
          {lang === "dv" ? "ފުށުންޖެހުމަށް" : "Flip"}
        </span>
        <span className="font-faruma">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">←</kbd>{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">→</kbd>{" "}
          {lang === "dv" ? "ބަދަލުކުރުމަށް" : "Navigate"}
        </span>
        <span className="font-faruma">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">T</kbd>{" "}
          {lang === "dv" ? "ކުރިމަތި" : "Term/Def"}
        </span>
        <span className="font-faruma">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">M</kbd>{" "}
          {lang === "dv" ? "ހިތުދަސް" : "Memorized"}
        </span>
        <span className="font-faruma">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-warn font-mono">F</kbd>{" "}
          {lang === "dv" ? "ފޭވަރިޓް" : "Favorite"}
        </span>
        <span className="font-faruma">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono">S</kbd>{" "}
          {lang === "dv" ? "އޮޅުވާލުމަށް" : "Shuffle"}
        </span>
      </div>
    </div>
  );
};
