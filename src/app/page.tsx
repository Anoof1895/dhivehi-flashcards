"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  GraduationCap,
  Zap,
  LayoutGrid,
  Printer,
  Sparkles,
  HelpCircle,
  X,
  Share2,
  Globe,
  ChevronDown,
  Plus,
  Download,
  Pencil,
  Trash2,
  Check,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";
import { FlashcardDeckData } from "@/data/decks";
import { useDecksAndProgress } from "@/hooks/useDecksAndProgress";
import { useTheme } from "@/hooks/useTheme";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { LearnQuizView } from "@/components/LearnQuizView";
import { MatchGameView } from "@/components/MatchGameView";
import { CardsGridView } from "@/components/CardsGridView";
import { PrintableCardsView } from "@/components/PrintableCardsView";
import { DeckModal, DeckModalMode } from "@/components/DeckModal";

type ActiveTab = "flashcards" | "learn" | "match" | "browse" | "print";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("flashcards");
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>(undefined);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [lang, setLang] = useState<"en" | "dv">("en");

  const { isDark, toggleTheme } = useTheme();

  // Deck Selector Dropdown & Modal state
  const [isDeckMenuOpen, setIsDeckMenuOpen] = useState(false);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [deckModalMode, setDeckModalMode] = useState<DeckModalMode>("create");
  const [modalTargetDeck, setModalTargetDeck] = useState<FlashcardDeckData | null>(null);

  const deckMenuRef = useRef<HTMLDivElement | null>(null);

  const {
    allDecks,
    activeDeck,
    selectDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    frontSide,
    toggleFrontSide,
    memorized,
    favorites,
    toggleMemorized,
    toggleFavorite,
    resetDeckProgress,
  } = useDecksAndProgress();

  // Keep document html lang in sync
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
  }, [lang]);

  // Close deck dropdown on outside click
  useEffect(() => {
    if (!isDeckMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (deckMenuRef.current && !deckMenuRef.current.contains(e.target as Node)) {
        setIsDeckMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isDeckMenuOpen]);

  const openModal = (mode: DeckModalMode, deck?: FlashcardDeckData) => {
    setModalTargetDeck(deck ?? activeDeck);
    setDeckModalMode(mode);
    setDeckModalOpen(true);
    setIsDeckMenuOpen(false);
  };

  const handleSelectCardFromGrid = (id: number) => {
    setSelectedCardId(id);
    setActiveTab("flashcards");
  };

  const handleShare = async () => {
    const shareText =
      "ދިވެހި ބަސްކޮށާރު — Fast, ad-free Dhivehi & Bilingual Flashcard Studio with authentic Faruma typography";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Dhivehi & Bilingual Flashcard Studio",
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const activeDeckLabel =
    lang === "dv" && activeDeck.titleDv
      ? `${activeDeck.titleDv} (${activeDeck.cards.length})`
      : `${activeDeck.title} (${activeDeck.cards.length})`;

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-app text-fg flex flex-col justify-between selection:bg-accent/25 selection:text-accent-soft relative overflow-x-clip"
    >
      {/* ================= ONE CONSOLIDATED TOP BAR (max-w-6xl) ================= */}
      <header className="print:hidden sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-xl border-b border-line px-3 sm:px-6 h-16 flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Brand Emblem + Title + Deck Switcher + "+ New Deck" */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-accent-soft shadow-md flex items-center justify-center">
                <span className="font-faruma text-white font-bold text-base leading-none select-none" dir="rtl">
                  ދ
                </span>
              </div>
              <h1 className="font-faruma text-sm font-bold text-fg hidden xl:block whitespace-nowrap">
                {lang === "dv" ? "ބަސްކޮށާރު" : "Dhivehi Studio"}
              </h1>
            </div>

            {/* Deck Switcher Dropdown */}
            <div className="relative min-w-0 max-w-[210px] sm:max-w-[280px]" ref={deckMenuRef}>
              <button
                type="button"
                onClick={() => setIsDeckMenuOpen((prev) => !prev)}
                className="font-faruma w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-xs sm:text-sm font-semibold text-fg transition shadow-sm"
                title="Switch Deck"
              >
                <BookOpen className="w-3.5 h-3.5 text-accent shrink-0" />
                <span dir="auto" className="truncate text-fg">
                  {activeDeckLabel}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${
                    isDeckMenuOpen ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDeckMenuOpen && (
                <div className="absolute left-0 mt-2 w-[310px] sm:w-[360px] rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
                      Your Decks ({allDecks.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => openModal("export", activeDeck)}
                      className="text-[11px] text-accent-soft hover:text-accent flex items-center gap-1 font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export Active</span>
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-line">
                    {allDecks.map((d) => {
                      const isSelected = d.id === activeDeck.id;
                      return (
                        <div
                          key={d.id}
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-2 transition ${
                            isSelected ? "bg-accent-glow" : "hover:bg-elevated"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              selectDeck(d.id);
                              setSelectedCardId(undefined);
                              setIsDeckMenuOpen(false);
                            }}
                            className="flex-1 min-w-0 text-left flex items-center gap-2.5"
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-accent text-white" : "border border-line-strong"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-faruma text-xs sm:text-sm font-semibold text-fg truncate">
                                {d.title}{" "}
                                <span className="text-accent-soft font-mono text-xs">
                                  ({d.cards.length})
                                </span>
                              </div>
                              {d.titleDv && (
                                <div dir="rtl" className="font-faruma text-[11px] text-muted truncate text-left">
                                  {d.titleDv}
                                </div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openModal("export", d)}
                              className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-elevated transition"
                              title="Export Deck"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {!d.isBuiltIn && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openModal("edit", d)}
                                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-elevated transition"
                                  title="Edit Deck"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete deck "${d.title}"?`)) {
                                      deleteDeck(d.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition"
                                  title="Delete Deck"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 border-t border-line bg-elevated">
                    <button
                      type="button"
                      onClick={() => openModal("create")}
                      className="w-full py-2 px-3 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Import from Quizlet / New Deck</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* "+ New" Button */}
            <button
              type="button"
              onClick={() => openModal("create")}
              className="font-faruma flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 shadow-sm active:scale-95"
              title="Import from Quizlet or Create New Deck"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {lang === "dv" ? "އާ ޑެކެއް" : "New Deck"}
              </span>
            </button>
          </div>

          {/* Center: Desktop View Mode Tabs (Hidden on mobile, consolidated on desktop) */}
          <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-elevated border border-line shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("flashcards")}
              className={`font-faruma flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "flashcards"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === "dv" ? "ކާޑުތައް" : "Flashcards"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("learn")}
              className={`font-faruma flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "learn"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{lang === "dv" ? "ލާން / ކުއިޒް" : "Learn"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("match")}
              className={`font-faruma flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "match"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-warn" />
              <span>{lang === "dv" ? "މެޗް ގޭމް" : "Match"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("browse")}
              className={`font-faruma flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "browse"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{lang === "dv" ? "ހުރިހާ" : "Browse"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("print")}
              className={`font-faruma flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "print"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === "dv" ? "ޕްރިންޓް" : "Print"}</span>
            </button>
          </nav>

          {/* Right Tools: Language Toggle + Theme Toggle + Export + Help */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "dv" : "en")}
              className="font-faruma px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-line bg-elevated hover:bg-elevated-hover text-muted hover:text-fg transition-all flex items-center gap-1"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-muted hidden sm:inline" />
              <span className={lang === "en" ? "text-accent-soft font-bold" : "text-muted"}>
                EN
              </span>
              <span className="text-muted-soft text-[10px]">/</span>
              <span className={`font-faruma ${lang === "dv" ? "text-accent-soft font-bold" : "text-muted"}`}>
                ދިވެހި
              </span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-muted hover:text-fg transition active:scale-95"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-warn" /> : <Moon className="w-4 h-4 text-accent" />}
            </button>

            {/* Export Deck */}
            <button
              type="button"
              onClick={() => openModal("export", activeDeck)}
              className="hidden sm:flex p-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-muted hover:text-fg transition"
              title="Export Deck"
              aria-label="Export Deck"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Help / Guide */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-muted hover:text-fg transition"
              title="Shortcuts & Guide"
              aria-label="Shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT (max-w-3xl for Cards/Learn/Match, max-w-6xl for Browse/Print) ================= */}
      <main className="relative z-10 flex-1 w-full mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-24 lg:pb-12 print:p-0 print:m-0 print:max-w-none">
        {activeTab === "flashcards" ? (
          <FlashcardDeck
            key={`${activeDeck.id}-${selectedCardId ?? "default"}`}
            deck={activeDeck}
            frontSide={frontSide}
            onToggleFrontSide={toggleFrontSide}
            memorized={memorized}
            favorites={favorites}
            onToggleMemorized={toggleMemorized}
            onToggleFavorite={toggleFavorite}
            initialCardId={selectedCardId}
            lang={lang}
          />
        ) : activeTab === "learn" ? (
          <LearnQuizView
            key={activeDeck.id}
            deck={activeDeck}
            memorized={memorized}
            onToggleMemorized={toggleMemorized}
            lang={lang}
          />
        ) : activeTab === "match" ? (
          <MatchGameView
            key={activeDeck.id}
            deck={activeDeck}
            onNavigateToFlashcards={() => setActiveTab("flashcards")}
            lang={lang}
          />
        ) : activeTab === "browse" ? (
          <CardsGridView
            key={activeDeck.id}
            deck={activeDeck}
            memorized={memorized}
            favorites={favorites}
            onToggleMemorized={toggleMemorized}
            onToggleFavorite={toggleFavorite}
            onSelectCard={handleSelectCardFromGrid}
            lang={lang}
          />
        ) : (
          <PrintableCardsView deck={activeDeck} lang={lang} />
        )}
      </main>

      {/* ================= MOBILE BOTTOM TAB BAR (Fixed, Zero Overflow) ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-line px-3 py-2 flex items-center justify-around pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("flashcards")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "flashcards" ? "text-accent font-bold" : "text-muted hover:text-fg"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-faruma">{lang === "dv" ? "ކާޑު" : "Cards"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("learn")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "learn" ? "text-accent font-bold" : "text-muted hover:text-fg"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="text-[10px] font-faruma">{lang === "dv" ? "ލާން" : "Learn"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("match")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "match" ? "text-accent font-bold" : "text-muted hover:text-fg"
          }`}
        >
          <Zap className="w-4 h-4 text-warn" />
          <span className="text-[10px] font-faruma">{lang === "dv" ? "މެޗް" : "Match"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("browse")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "browse" ? "text-accent font-bold" : "text-muted hover:text-fg"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-[10px] font-faruma">{lang === "dv" ? "ހުރިހާ" : "Browse"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("print")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "print" ? "text-accent font-bold" : "text-muted hover:text-fg"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span className="text-[10px] font-faruma">{lang === "dv" ? "ޕްރިންޓް" : "Print"}</span>
        </button>
      </nav>

      {/* ================= FOOTER ================= */}
      <footer className="print:hidden relative z-10 w-full border-t border-line bg-surface/50 py-5 text-center text-xs text-muted">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="font-faruma text-xs text-muted">
            {lang === "dv"
              ? `އެކްޓިވް ޑެކް: ${activeDeck.titleDv ?? activeDeck.title} (${activeDeck.cards.length} ކާޑު)`
              : `${activeDeck.title} • ${activeDeck.cards.length} cards • Modern Study Studio`}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="font-faruma">
              {lang === "dv" ? "ފަރުމާ ފޮންޓު" : "Authentic Faruma Typography"}
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={() => openModal("export", activeDeck)}
              className="text-muted hover:text-accent-soft transition underline underline-offset-2"
            >
              {lang === "dv" ? "އެކްސްޕޯޓް" : "Export Deck"}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                const msg =
                  lang === "dv"
                    ? "މި ޑެކްގެ ހުރިހާ ޕްރޮގްރެސްއެއް ފޮހެލަން ބޭނުންފުޅުތޯ؟"
                    : `Reset progress for "${activeDeck.title}"?`;
                if (window.confirm(msg)) {
                  resetDeckProgress();
                }
              }}
              className="text-muted hover:text-danger transition underline underline-offset-2"
            >
              {lang === "dv" ? "އަލުން ފަށާ" : "Reset Progress"}
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}
      {deckModalOpen && (
        <DeckModal
          key={`${deckModalMode}-${(modalTargetDeck ?? activeDeck).id}`}
          isOpen={deckModalOpen}
          mode={deckModalMode}
          targetDeck={modalTargetDeck ?? activeDeck}
          onClose={() => setDeckModalOpen(false)}
          onCreateDeck={(title, cards) => {
            createDeck(title, cards);
            setActiveTab("flashcards");
          }}
          onUpdateDeck={(id, title, cards) => {
            updateDeck(id, title, cards);
          }}
          onDeleteDeck={(id) => {
            deleteDeck(id);
          }}
          lang={lang}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-surface border border-line p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="font-faruma">
                  {lang === "dv" ? "ސްޓޫޑިއޯ ބޭނުންކުރާނެ ގޮތް" : "Studio Shortcuts & Guide"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-xl text-muted hover:text-fg hover:bg-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-fg-soft">
              {lang === "dv" ? (
                <div className="font-faruma text-right space-y-1.5 leading-relaxed text-sm" dir="rtl">
                  <p>• <strong>ކާޑު ފުށުންޖެހުން:</strong> Space ފިއްތާލުމުން މާނަ ފެންނާނެއެވެ.</p>
                  <p>• <strong>މެޗް ގޭމް:</strong> ބަހާއި މާނަ ގުޅުވައިގެން އެންމެ އަވަހަށް ބޯޑު ހުސްކޮށް ރެކޯޑު ހަދާށެވެ.</p>
                  <p>• <strong>ސުވާލު މޯޑު:</strong> 1، 2، 3، 4 އަށް ފިއްތައިގެން އަވަހަށް ޖަވާބު ދެވޭނެއެވެ.</p>
                </div>
              ) : (
                <div className="text-left space-y-2 leading-relaxed text-sm text-fg-soft" dir="ltr">
                  <p>
                    • <strong>Wide 3D Cards:</strong> Click card or press{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono text-xs">
                      Space
                    </kbd>{" "}
                    to flip. Press{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono text-xs">
                      T
                    </kbd>{" "}
                    to toggle Front Side (Term ↔ Def).
                  </p>
                  <p>
                    • <strong>Timed Match Game:</strong> Clear 6 pairs as fast as you can. Penalties add +1s to your time.
                  </p>
                  <p>
                    • <strong>Learn Quiz:</strong> Practice with 4-choice options and keys{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono text-xs">
                      1
                    </kbd>{" "}
                    –{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-fg font-mono text-xs">
                      4
                    </kbd>
                    .
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-line">
                <h4 className="font-faruma text-xs uppercase tracking-wider text-muted font-bold mb-2">
                  {lang === "dv" ? "ކީބޯޑު ޝޯޓްކަޓްތައް" : "Keyboard Shortcuts"}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-elevated border border-line">
                    <span className="font-faruma text-muted">Flip Card</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-fg font-mono">
                      Space
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-elevated border border-line">
                    <span className="font-faruma text-muted">Next / Prev</span>
                    <span className="space-x-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-fg font-mono">
                        ←
                      </kbd>
                      <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-fg font-mono">
                        →
                      </kbd>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-elevated border border-line">
                    <span className="font-faruma text-muted">Quiz Options</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-fg font-mono">
                      1 – 4
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-elevated border border-line">
                    <span className="font-faruma text-muted">Term ↔ Def</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-fg font-mono">
                      T
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2.5 rounded-2xl bg-elevated hover:bg-elevated-hover border border-line text-fg font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-accent" />
                  <span>{copiedShare ? "Link Copied!" : "Share Flashcard Studio"}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="font-faruma w-full py-2.5 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition active:scale-95 shadow-md"
            >
              {lang === "dv" ? "ލައްޕާލާ" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
