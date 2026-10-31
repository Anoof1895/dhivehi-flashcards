"use client";

import React, { useState } from "react";
import {
  FlashcardDeckData,
  FlashcardItem,
  getTextDir,
} from "@/data/decks";
import {
  Printer,
  Grid,
  Hash,
  Scissors,
  Sparkles,
  Info,
} from "lucide-react";

interface PrintableCardsViewProps {
  deck: FlashcardDeckData;
  lang: "en" | "dv";
}

type GridSize = "4" | "6" | "9";
type BorderStyle = "rounded" | "dashed" | "hairline";

export function PrintableCardsView({ deck, lang }: PrintableCardsViewProps) {
  const [gridSize, setGridSize] = useState<GridSize>("6");
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [showDefinitions, setShowDefinitions] = useState<boolean>(true);
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("rounded");

  const handlePrint = () => {
    window.print();
  };

  const getGridClasses = () => {
    switch (gridSize) {
      case "4":
        return "grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-4";
      case "6":
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-3.5 print:gap-3";
      case "9":
      default:
        return "grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-3 print:gap-2.5";
    }
  };

  const getCardBorderClasses = () => {
    switch (borderStyle) {
      case "dashed":
        return "rounded-none border border-dashed border-neutral-400";
      case "hairline":
        return "rounded-lg border border-neutral-200";
      case "rounded":
      default:
        return "rounded-2xl border border-neutral-300 shadow-sm print:shadow-none";
    }
  };

  const getTermSizeClasses = () => {
    switch (gridSize) {
      case "4":
        return "text-3xl sm:text-4xl print:text-3xl mb-3";
      case "6":
        return "text-2xl sm:text-3xl print:text-2xl mb-2";
      case "9":
      default:
        return "text-xl sm:text-2xl print:text-xl mb-1.5";
    }
  };

  const getDefinitionSizeClasses = () => {
    switch (gridSize) {
      case "4":
        return "text-lg sm:text-xl print:text-lg font-medium text-neutral-900 leading-[1.85]";
      case "6":
        return "text-base sm:text-lg print:text-base font-medium text-neutral-900 leading-[1.85]";
      case "9":
      default:
        return "text-sm sm:text-base print:text-sm font-medium text-neutral-900 leading-[1.8]";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* ================= Printable View Controls (Hidden in Print) ================= */}
      <div className="print:hidden mb-8 p-4 sm:p-5 rounded-3xl bg-surface border border-line shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-fg flex items-center gap-2">
              <Printer className="w-5 h-5 text-accent" />
              <span dir={lang === "dv" ? "rtl" : "ltr"}>
                {lang === "dv"
                  ? `ފްލޭޝްކާޑު ޕްރިންޓްކުރުން — ${deck.titleDv ?? deck.title}`
                  : `Printable Flashcards — ${deck.title} (${deck.cards.length})`}
              </span>
            </h2>
            <p className="text-xs text-muted mt-1" dir={lang === "dv" ? "rtl" : "ltr"}>
              {lang === "dv"
                ? "މިނިމަލިސްޓް ހުދު ކާޑުތައް A4 ގަނޑުގައި ޕްރިންޓްކޮށް، ކަފައިގެން ބޭނުންކުރައްވާ"
                : "Minimalist white study cards formatted with authentic Faruma typography for A4 printing & PDF export"}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-95 flex-shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === "dv" ? "ޕްރިންޓް / ސޭވް PDF" : "Print / Save as PDF"}</span>
          </button>
        </div>

        {/* Control Switches & Layout Configs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Layout / Cards Per Page */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-elevated border border-line">
            <span className="text-muted font-medium flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-accent" />
              {lang === "dv" ? "ކާޑުގެ ސައިޒު" : "Cards per Page"}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {(["4", "6", "9"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setGridSize(sz)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-center font-medium transition ${
                    gridSize === sz
                      ? "bg-accent/15 text-accent-soft border border-accent/40 shadow-sm"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {sz === "4" ? "2×2 (4)" : sz === "6" ? "2×3 (6)" : "3×3 (9)"}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Border Style */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-elevated border border-line">
            <span className="text-muted font-medium flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-accent" />
              {lang === "dv" ? "ކާޑުގެ ކައިރިފަށު" : "Border Style"}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => setBorderStyle("rounded")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center font-medium transition ${
                  borderStyle === "rounded"
                    ? "bg-accent/15 text-accent-soft border border-accent/40 shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {lang === "dv" ? "ބޮޅު" : "Rounded"}
              </button>
              <button
                type="button"
                onClick={() => setBorderStyle("dashed")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center font-medium transition ${
                  borderStyle === "dashed"
                    ? "bg-accent/15 text-accent-soft border border-accent/40 shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {lang === "dv" ? "ކަފާ ރޮނގު" : "Dashed"}
              </button>
              <button
                type="button"
                onClick={() => setBorderStyle("hairline")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center font-medium transition ${
                  borderStyle === "hairline"
                    ? "bg-accent/15 text-accent-soft border border-accent/40 shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {lang === "dv" ? "ތުނި" : "Hairline"}
              </button>
            </div>
          </div>

          {/* 3. Card Number Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-elevated border border-line">
            <div>
              <span className="text-fg font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-accent" />
                {lang === "dv" ? "ނަންބަރު ދެއްކުން" : "Card Number (#01)"}
              </span>
              <p className="text-[10px] text-muted mt-0.5">
                {lang === "dv" ? "ކާޑުގެ ކަނުގައި ނަންބަރު ޖެހުން" : "Print number on top corner"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNumbers((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                showNumbers ? "bg-accent" : "bg-line-strong"
              }`}
              aria-label="Toggle card numbers"
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  showNumbers ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. Show Definition Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-elevated border border-line">
            <div>
              <span className="text-fg font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                {lang === "dv" ? "މާނަ ހިމެނުން" : "Include Definition"}
              </span>
              <p className="text-[10px] text-muted mt-0.5">
                {lang === "dv" ? "ބަހާއި މާނަ އެއް ކާޑެއްގައި" : "Show both Term & Definition"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDefinitions((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                showDefinitions ? "bg-accent" : "bg-line-strong"
              }`}
              aria-label="Toggle definitions on print cards"
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  showDefinitions ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Print Tip Helper */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-accent-glow border border-accent/20 text-[11px] text-accent-soft">
          <Info className="w-4 h-4 text-accent flex-shrink-0" />
          <span>
            {lang === "dv"
              ? "ޕްރިންޓް ޑައިލޮގްގައި 'Destination: Save as PDF' ނުވަތަ ޕްރިންޓަރ ޚިޔާރުކުރައްވާށެވެ. މާޖިން 'Default' ނުވަތަ 'None' ބަހައްޓަވާށެވެ."
              : "Tip: In the print dialog, set Destination to 'Save as PDF' or your printer, and Margins to 'Default' or 'Minimum'."}
          </span>
        </div>
      </div>

      {/* ================= Printable Sheet: Clean White Cards ================= */}
      <div className={`grid ${getGridClasses()} w-full pb-16 print:pb-0 print:w-full print:max-w-none`}>
        {deck.cards.map((card: FlashcardItem) => {
          const formattedId = String(card.id).padStart(2, "0");
          const termDir = getTextDir(card.term);
          const defDir = getTextDir(card.definition);

          return (
            <div
              key={card.id}
              className={`printable-card bg-white text-neutral-900 ${getCardBorderClasses()} aspect-square flex flex-col justify-between items-center text-center p-4 sm:p-6 print:p-4 relative overflow-hidden select-all`}
              style={{
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              <div className="w-full flex items-center justify-start text-neutral-400 font-mono text-xs mb-1 min-h-[16px]">
                {showNumbers ? <span>#{formattedId}</span> : null}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center w-full my-auto">
                <h3
                  lang={termDir === "rtl" ? "dv" : "en"}
                  dir={termDir}
                  className={`font-faruma ${getTermSizeClasses()} font-bold text-black drop-shadow-none leading-[1.8] select-text break-words max-w-[94%]`}
                >
                  {card.term}
                </h3>

                {showDefinitions && (
                  <>
                    <div className="w-14 h-px bg-neutral-200 my-2.5 print:my-1.5" />
                    <p
                      lang={defDir === "rtl" ? "dv" : "en"}
                      dir={defDir}
                      className={`font-faruma ${getDefinitionSizeClasses()} max-w-[92%] select-text break-words`}
                    >
                      {card.definition}
                    </p>
                  </>
                )}
              </div>

              <div className="w-full min-h-[16px]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
