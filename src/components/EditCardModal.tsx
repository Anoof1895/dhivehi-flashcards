"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Trash2, Check, Sparkles } from "lucide-react";
import { FlashcardItem, getTextDir } from "@/data/decks";

interface EditCardModalProps {
  isOpen: boolean;
  card?: FlashcardItem | null; // null/undefined means creating a new card
  deckTitle: string;
  onClose: () => void;
  onSave: (card: { id?: number; term: string; definition: string }) => void;
  onDelete?: (cardId: number) => void;
  lang?: "en" | "dv";
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  card,
  deckTitle,
  onClose,
  onSave,
  onDelete,
  lang = "en",
}) => {
  const isEditing = Boolean(card);
  const [term, setTerm] = useState(() => card?.term ?? "");
  const [definition, setDefinition] = useState(() => card?.definition ?? "");
  const [error, setError] = useState<string | null>(null);
  const termInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmedTerm = term.trim();
      const trimmedDef = definition.trim();

      if (!trimmedTerm) {
        setError(lang === "dv" ? "ބަސް ލިޔުއްވާ" : "Please enter a term / word");
        return;
      }
      if (!trimmedDef) {
        setError(lang === "dv" ? "މާނަ ލިޔުއްވާ" : "Please enter the definition / meaning");
        return;
      }

      onSave({
        id: card?.id,
        term: trimmedTerm,
        definition: trimmedDef,
      });
      onClose();
    },
    [term, definition, lang, card?.id, onSave, onClose]
  );

  const handleDelete = useCallback(() => {
    if (!card || !onDelete) return;
    const confirmMsg =
      lang === "dv"
        ? `މި ކާޑު (${card.term}) ފޮހެލަންވީތަ؟`
        : `Are you sure you want to delete card #${card.id} ("${card.term}")?`;
    if (window.confirm(confirmMsg)) {
      onDelete(card.id);
      onClose();
    }
  }, [card, onDelete, lang, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    // Auto-focus input on open
    termInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  if (!isOpen) return null;

  const termDir = getTextDir(term || (lang === "dv" ? "ބަސް" : "A"));
  const defDir = getTextDir(definition || (lang === "dv" ? "މާނަ" : "A"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-surface border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-elevated/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent-glow border border-accent/30 text-accent flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-faruma text-base sm:text-lg font-bold text-fg truncate">
                {isEditing
                  ? lang === "dv"
                    ? `ކާޑު ބަދަލުކުރުން #${card?.id}`
                    : `Edit Card #${card?.id}`
                  : lang === "dv"
                  ? "އާ ކާޑެއް އިތުރުކުރުން"
                  : "Add New Card"}
              </h2>
              <p className="font-faruma text-xs text-muted truncate">
                {deckTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-fg hover:bg-elevated transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Term Input */}
          <div>
            <label className="font-faruma flex items-center justify-between text-xs font-semibold text-fg-soft mb-1.5">
              <span>{lang === "dv" ? "ބަސް (Term)" : "Term / Vocabulary Word"}</span>
              <span className="text-[11px] text-muted font-normal">
                {termDir === "rtl" ? "RTL (ދިވެހި)" : "LTR (English)"}
              </span>
            </label>
            <input
              ref={termInputRef}
              type="text"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                if (error) setError(null);
              }}
              dir={termDir}
              lang={termDir === "rtl" ? "dv" : "en"}
              placeholder={lang === "dv" ? "މިސާލަކަށް: ޙުރުމަތްތެރި" : "e.g. ޙުރުމަތްތެރި or Serendipity"}
              className="font-faruma w-full px-4 py-3 rounded-2xl bg-elevated hover:bg-elevated-hover focus:bg-elevated border border-line focus:border-accent outline-none text-fg text-lg sm:text-xl font-bold placeholder:text-muted/60 transition shadow-inner"
            />
          </div>

          {/* Definition Input */}
          <div>
            <label className="font-faruma flex items-center justify-between text-xs font-semibold text-fg-soft mb-1.5">
              <span>{lang === "dv" ? "މާނަ (Definition)" : "Definition / Meaning"}</span>
              <span className="text-[11px] text-muted font-normal">
                {defDir === "rtl" ? "RTL (ދިވެހި)" : "LTR (English)"}
              </span>
            </label>
            <textarea
              rows={4}
              value={definition}
              onChange={(e) => {
                setDefinition(e.target.value);
                if (error) setError(null);
              }}
              dir={defDir}
              lang={defDir === "rtl" ? "dv" : "en"}
              placeholder={
                lang === "dv"
                  ? "މިސާލަކަށް: ގަދަރުވެރި / އިއްޒަތްތެރި / ކަމޭހިތާ ހިތުން"
                  : "e.g. ގަދަރުވެރި / އިއްޒަތްތެރި / ކަމޭހިތާ ހިތުން"
              }
              className="font-faruma w-full px-4 py-3 rounded-2xl bg-elevated hover:bg-elevated-hover focus:bg-elevated border border-line focus:border-accent outline-none text-fg text-base sm:text-lg leading-[1.9] placeholder:text-muted/60 transition shadow-inner resize-none"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted">
              <span>
                {lang === "dv"
                  ? "ނޯޓް: ބަދަލު ސޭވްކުރުމަށް Ctrl+Enter ފިއްތާލައްވާ"
                  : "Tip: Press Ctrl+Enter to save quickly"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-line">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="font-faruma py-2.5 px-3.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                title="Delete this card"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === "dv" ? "ފޮހެލާ" : "Delete Card"}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="font-faruma py-2.5 px-4 rounded-xl border border-line hover:bg-elevated text-muted hover:text-fg text-xs font-semibold transition"
              >
                {lang === "dv" ? "ކެންސަލް" : "Cancel"}
              </button>

              <button
                type="submit"
                className="font-faruma py-2.5 px-5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isEditing
                    ? lang === "dv"
                      ? "ބަދަލު ސޭވްކުރޭ"
                      : "Save Changes"
                    : lang === "dv"
                    ? "ކާޑު އިތުރުކުރޭ"
                    : "Add Card"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
