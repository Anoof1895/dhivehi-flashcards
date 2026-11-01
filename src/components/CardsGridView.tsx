"use client";

import React, { useState, useMemo } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { Search, Heart, Check, X, Pencil, Plus } from "lucide-react";
import {
  FlashcardDeckData,
  FlashcardItem,
  normalizeArabic,
  normalizeThaana,
  getTextDir,
} from "@/data/decks";

interface CardsGridViewProps {
  deck: FlashcardDeckData;
  memorized: Set<number>;
  favorites: Set<number>;
  onToggleMemorized: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onSelectCard: (id: number) => void;
  onEditCard?: (card: FlashcardItem) => void;
  onAddCard?: () => void;
  lang?: "en" | "dv";
}

type FilterOption = "all" | "memorized" | "unmemorized" | "favorites";

interface GridCardProps {
  card: FlashcardItem;
  isMemorized: boolean;
  isFavorite: boolean;
  onToggleMemorized: () => void;
  onToggleFavorite: () => void;
  onSelect: () => void;
  onEdit?: () => void;
  lang: "en" | "dv";
}

const GridCard: React.FC<GridCardProps> = ({
  card,
  isMemorized,
  isFavorite,
  onToggleMemorized,
  onToggleFavorite,
  onSelect,
  onEdit,
  lang,
}) => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const borderGlow = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.35), transparent 70%)`;
  const surfaceSpotlight = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.05), transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-1000);
    mouseY.set(-1000);
  };

  const defLines = card.definition.split("\n").filter((l) => l.trim().length > 0);
  const formattedId = String(card.id).padStart(2, "0");
  const termDir = getTextDir(card.term);
  const defDir = getTextDir(card.definition);

  return (
    <div
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative rounded-2xl p-[1px] bg-line transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong cursor-pointer shadow-lg focus:outline-none focus-visible:outline-none ${
        isMemorized ? "ring-1 ring-success/35" : ""
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Indigo Border Reveal */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: borderGlow }}
      />

      {/* Card Content Surface */}
      <div className="relative w-full h-full rounded-[calc(1rem-1px)] p-5 flex flex-col justify-between overflow-hidden bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[calc(1rem-1px)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: surfaceSpotlight }}
        />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between w-full mb-2" dir="ltr">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg transition-all text-muted hover:text-accent-soft hover:bg-elevated"
                aria-label="Edit card"
                title={lang === "dv" ? "ކާޑު ބަދަލުކުރުން" : "Edit card"}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg transition-all ${
                isFavorite
                  ? "text-warn fill-warn bg-warn/15"
                  : "text-muted hover:text-warn hover:bg-elevated"
              }`}
              aria-label="Toggle favorite"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-warn" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onToggleMemorized}
              className={`p-1.5 rounded-lg transition-all ${
                isMemorized
                  ? "text-success bg-success/15 border border-success/35"
                  : "text-muted hover:text-success hover:bg-elevated"
              }`}
              aria-label="Toggle memorized"
            >
              <Check className={`w-3.5 h-3.5 ${isMemorized ? "stroke-[2.8]" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isMemorized && (
              <span className="font-faruma text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 border border-success/30 text-success">
                {lang === "dv" ? "ހިތުދަސް" : "Mastered"}
              </span>
            )}
            <span className="font-mono text-xs font-semibold text-muted">
              #{formattedId}
            </span>
          </div>
        </div>

        {/* Center Term */}
        <div className="relative z-10 py-3 text-center">
          <h3
            lang={termDir === "rtl" ? "dv" : "en"}
            dir={termDir}
            className="font-faruma text-2xl sm:text-3xl font-bold leading-[1.85] text-fg select-text text-center break-words"
          >
            {card.term}
          </h3>
        </div>

        {/* Divider */}
        <div className="relative z-10 h-px w-full bg-line my-2" />

        {/* Bottom Definition */}
        <div
          className={`font-faruma relative z-10 w-full self-stretch text-base leading-[1.95] text-fg-soft space-y-1 select-text ${
            defDir === "rtl" ? "text-right" : "text-left"
          }`}
          lang={defDir === "rtl" ? "dv" : "en"}
          dir={defDir}
        >
          {defLines.map((line, idx) => (
            <p
              key={idx}
              dir={defDir}
              className="w-full self-stretch leading-[1.95] break-words"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardsGridView: React.FC<CardsGridViewProps> = ({
  deck,
  memorized,
  favorites,
  onToggleMemorized,
  onToggleFavorite,
  onSelectCard,
  onEditCard,
  onAddCard,
  lang = "en",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");

  const cards = deck.cards;

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim();
    const isNum = /^\d+$/.test(q);
    const numVal = isNum ? parseInt(q, 10) : null;
    const normArabicQuery = normalizeArabic(q);
    const normThaanaQuery = normalizeThaana(q);

    return cards.filter((item) => {
      if (filter === "memorized" && !memorized.has(item.id)) return false;
      if (filter === "unmemorized" && memorized.has(item.id)) return false;
      if (filter === "favorites" && !favorites.has(item.id)) return false;

      if (!q) return true;
      if (numVal !== null && item.id === numVal) return true;

      if (
        normalizeThaana(item.term).includes(normThaanaQuery) ||
        normalizeThaana(item.definition).includes(normThaanaQuery)
      ) {
        return true;
      }

      if (
        normalizeArabic(item.term).includes(normArabicQuery) ||
        normalizeArabic(item.definition).includes(normArabicQuery)
      ) {
        return true;
      }

      return false;
    });
  }, [cards, searchQuery, filter, memorized, favorites]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* ================= Search & Filter Bar ================= */}
      <div className="sticky top-16 z-30 mb-6 p-3 sm:p-4 rounded-2xl bg-surface/95 backdrop-blur-xl border border-line shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none transition-all ${
                lang === "dv" ? "right-3.5" : "left-3.5"
              }`}
            />
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "dv"
                  ? "ނަންބަރު، ބަސް ނުވަތަ މާނައިން ހޯއްދަވާ..."
                  : "Search by number, Dhivehi term, or definition..."
              }
              className={`font-faruma w-full py-2.5 rounded-xl bg-elevated border border-line text-fg placeholder:text-muted-soft text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition ${
                lang === "dv" ? "pr-10 pl-10 text-right" : "pl-10 pr-10 text-left"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={`absolute top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fg ${
                  lang === "dv" ? "left-3" : "right-3"
                }`}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-1 rounded-xl bg-elevated border border-line flex-shrink-0"
            dir="ltr"
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
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
              onClick={() => setFilter("memorized")}
              className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === "memorized"
                  ? "bg-success/15 text-success border border-success/30 shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {lang === "dv" ? `ހިތުދަސް (${memorized.size})` : `Mastered (${memorized.size})`}
            </button>
            <button
              type="button"
              onClick={() => setFilter("unmemorized")}
              className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === "unmemorized"
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
              onClick={() => setFilter("favorites")}
              className={`font-faruma px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === "favorites"
                  ? "bg-warn/15 text-warn border border-warn/30 shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {lang === "dv" ? `ފޭވަރިޓް (${favorites.size})` : `Favorites (${favorites.size})`}
            </button>
          </div>

          {onAddCard && (
            <button
              type="button"
              onClick={onAddCard}
              className="font-faruma flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/90 text-white transition shadow-sm active:scale-95 shrink-0"
              title="Add a new card to this deck"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{lang === "dv" ? "އާ ކާޑެއް" : "Add Card"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-line">
          <span className="font-faruma">
            {lang === "dv"
              ? `${cards.length} ކާޑުގެ ތެރެއިން ${filteredCards.length}`
              : `Showing ${filteredCards.length} of ${cards.length} cards`}
          </span>
          <span className="font-faruma text-[11px] text-muted-soft">
            {lang === "dv"
              ? "ކާޑެއްގައި ފިއްތާލުމުން ފްލޭޝްކާޑު ހުޅުވޭނެ"
              : "Click any card to open in Flashcard view"}
          </span>
        </div>
      </div>

      {/* ================= Cards Grid ================= */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12" dir="ltr">
          {filteredCards.map((card) => (
            <GridCard
              key={card.id}
              card={card}
              isMemorized={memorized.has(card.id)}
              isFavorite={favorites.has(card.id)}
              onToggleMemorized={() => onToggleMemorized(card.id)}
              onToggleFavorite={() => onToggleFavorite(card.id)}
              onSelect={() => onSelectCard(card.id)}
              onEdit={() => onEditCard?.(card)}
              lang={lang}
            />
          ))}
        </div>
      ) : (
        <div className="w-full py-16 text-center text-muted">
          <p className="font-faruma text-base font-medium text-fg mb-1">
            {lang === "dv" ? "އެއްވެސް ކާޑެއް ނުފެނުނު" : "No matching cards found"}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setFilter("all");
            }}
            className="font-faruma mt-4 px-4 py-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-accent-soft text-xs font-medium transition"
          >
            {lang === "dv" ? "ފިލްޓަރުތައް ފިލުވާލާ" : "Clear Filters"}
          </button>
        </div>
      )}
    </div>
  );
};
