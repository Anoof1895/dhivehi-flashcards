"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Upload,
  ArrowLeftRight,
  Plus,
  Check,
  Copy,
  Download,
  Trash2,
  FileText,
  Sparkles,
  Pencil,
} from "lucide-react";
import {
  FlashcardDeckData,
  FlashcardItem,
  TermDelimiterOption,
  RowDelimiterOption,
  parseDeckText,
  serializeDeckText,
  resolveTermDelimiter,
  resolveRowDelimiter,
  getTextDir,
} from "@/data/decks";

export type DeckModalMode = "create" | "edit" | "export";

interface DeckModalProps {
  isOpen: boolean;
  mode: DeckModalMode;
  targetDeck: FlashcardDeckData;
  onClose: () => void;
  onCreateDeck: (title: string, cards: FlashcardItem[]) => void;
  onUpdateDeck: (deckId: string, title: string, cards: FlashcardItem[]) => void;
  onDeleteDeck: (deckId: string) => void;
  lang?: "en" | "dv";
}

export const DeckModal: React.FC<DeckModalProps> = ({
  isOpen,
  mode,
  targetDeck,
  onClose,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  lang = "en",
}) => {
  const isInitialEdit = mode === "edit";
  const [activeMode, setActiveMode] = useState<DeckModalMode>(mode);
  const [title, setTitle] = useState(() => (isInitialEdit ? targetDeck.title : ""));
  const [rawText, setRawText] = useState(() =>
    isInitialEdit ? serializeDeckText(targetDeck.cards, "\t", "\n") : ""
  );
  const [termDelim, setTermDelim] = useState<TermDelimiterOption>("tab");
  const [rowDelim, setRowDelim] = useState<RowDelimiterOption>("newline");
  const [customTermDelim, setCustomTermDelim] = useState(" - ");
  const [customRowDelim, setCustomRowDelim] = useState("\\n");
  const [isSwapped, setIsSwapped] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState<"quizlet" | "json">("quizlet");
  const [exportTermDelim, setExportTermDelim] = useState<"\t" | " - " | ",">("\t");
  const [copiedExport, setCopiedExport] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const parsedCards = useMemo(
    () =>
      parseDeckText(
        rawText,
        termDelim,
        rowDelim,
        customTermDelim,
        customRowDelim,
        isSwapped
      ),
    [rawText, termDelim, rowDelim, customTermDelim, customRowDelim, isSwapped]
  );

  const exportText = useMemo(() => {
    if (exportFormat === "json") {
      return JSON.stringify(
        {
          title: targetDeck.title,
          cards: targetDeck.cards.map((c) => ({
            id: c.id,
            term: c.term,
            definition: c.definition,
          })),
        },
        null,
        2
      );
    }
    return serializeDeckText(targetDeck.cards, exportTermDelim, "\n");
  }, [targetDeck, exportFormat, exportTermDelim]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const baseName = file.name.replace(/\.[^.]+$/, "");

      if (!title.trim() && baseName) {
        setTitle(baseName);
      }

      // Support JSON backup files as well as .txt / .csv / .tsv
      if (file.name.toLowerCase().endsWith(".json")) {
        try {
          const json = JSON.parse(text);
          if (json && Array.isArray(json.cards)) {
            if (typeof json.title === "string" && json.title.trim()) {
              setTitle(json.title.trim());
            }
            const converted = serializeDeckText(
              json.cards.map((c: { term?: string; definition?: string }, idx: number) => ({
                id: idx + 1,
                term: String(c.term ?? ""),
                definition: String(c.definition ?? ""),
              })),
              "\t",
              "\n"
            );
            setTermDelim("tab");
            setRowDelim("newline");
            setRawText(converted);
            setUploadStatus(`Loaded ${json.cards.length} cards from ${file.name}`);
            e.target.value = "";
            return;
          }
        } catch {
          // Fall through to plain text parsing
        }
      }

      // Auto-select delimiter based on file extension / content
      if (file.name.toLowerCase().endsWith(".csv") && !text.includes("\t")) {
        setTermDelim("comma");
      } else if (text.includes("\t")) {
        setTermDelim("tab");
      } else if (text.includes(" - ") || text.includes(" — ")) {
        setTermDelim("dash");
      }

      setRawText(text);
      setUploadStatus(`Loaded ${file.name}`);
    } catch {
      setUploadStatus("Failed to read file");
    } finally {
      e.target.value = "";
    }
  };

  const handleSwapSides = () => {
    if (parsedCards.length > 0) {
      const tSep = resolveTermDelimiter(termDelim, customTermDelim);
      const rSep = resolveRowDelimiter(rowDelim, customRowDelim);
      const swappedList = parsedCards.map((c, idx) => ({
        id: idx + 1,
        term: c.definition,
        definition: c.term,
      }));
      setRawText(serializeDeckText(swappedList, tSep, rSep));
      setIsSwapped(false);
    } else {
      setIsSwapped((prev) => !prev);
    }
  };

  const handleSave = () => {
    if (parsedCards.length === 0) return;
    const deckTitle =
      title.trim() ||
      (lang === "dv" ? "އާ ބަސްކޮށާރު" : `Custom Deck (${parsedCards.length})`);

    if (activeMode === "edit") {
      onUpdateDeck(targetDeck.id, deckTitle, parsedCards);
    } else {
      onCreateDeck(deckTitle, parsedCards);
    }
    onClose();
  };

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownloadExport = () => {
    const ext = exportFormat === "json" ? "json" : "txt";
    const mime =
      exportFormat === "json"
        ? "application/json;charset=utf-8"
        : "text/plain;charset=utf-8";
    const safeSlug =
      targetDeck.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0780-\u07bf]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "flashcards-deck";

    const blob = new Blob([exportText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeSlug}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const placeholderExample =
    termDelim === "tab"
      ? "ޙުރުމަތްތެރި\tގަދަރުވެރި / އިއްޒަތްތެރި\nނަލަހެދުން\tރީތި ފޭރާންލައި ޒީނަތްތެރިވުން\nResilience\tހިތްވަރު"
      : termDelim === "dash"
      ? "ޙުރުމަތްތެރި - ގަދަރުވެރި / އިއްޒަތްތެރި\nނަލަހެދުން - ރީތި ފޭރާންލައި ޒީނަތްތެރިވުން"
      : termDelim === "comma"
      ? "ޙުރުމަތްތެރި, ގަދަރުވެރި / އިއްޒަތްތެރި\nResilience, ހިތްވަރު"
      : "Term" + customTermDelim + "Definition";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-line shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <h2 className="font-faruma text-sm sm:text-base font-bold text-fg">
              {activeMode === "create"
                ? lang === "dv"
                  ? "އާ ޑެކެއް ހެދުން / Quizlet އިމްޕޯޓް"
                  : "Import / Create New Deck"
                : activeMode === "edit"
                ? lang === "dv"
                  ? "ޑެކް އިޞްލާޙުކުރުން"
                  : `Edit Deck: ${targetDeck.title}`
                : lang === "dv"
                ? "ޑެކް އެކްސްޕޯޓްކުރުން"
                : `Export Deck: ${targetDeck.title}`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switch Pills inside Modal */}
            <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-elevated border border-line text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("create");
                  setTitle("");
                  setRawText("");
                }}
                className={`px-3 py-1 rounded-lg transition ${
                  activeMode === "create"
                    ? "bg-accent/15 text-accent-soft border border-accent/30 shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                + New / Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode("edit");
                  setTitle(targetDeck.title);
                  setTermDelim("tab");
                  setRowDelim("newline");
                  setRawText(serializeDeckText(targetDeck.cards, "\t", "\n"));
                }}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeMode === "edit"
                    ? "bg-accent/15 text-accent-soft border border-accent/30 shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                <Pencil className="w-3 h-3" />
                Edit Active
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("export")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeMode === "export"
                    ? "bg-accent/15 text-accent-soft border border-accent/30 shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                Export ({targetDeck.cards.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted hover:text-fg hover:bg-elevated transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY ================= */}
        {activeMode === "export" ? (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-elevated border border-line">
              <div>
                <p className="text-xs font-semibold text-fg">
                  {targetDeck.title}{" "}
                  <span className="text-accent-soft font-mono">({targetDeck.cards.length} cards)</span>
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  Export directly back to Quizlet format (.txt / tab-delimited) or portable JSON backup.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-line self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setExportFormat("quizlet")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    exportFormat === "quizlet"
                      ? "bg-accent/20 text-accent-soft border border-accent/35"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Quizlet (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("json")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    exportFormat === "json"
                      ? "bg-accent/20 text-accent-soft border border-accent/35"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  JSON (.json)
                </button>
              </div>
            </div>

            {exportFormat === "quizlet" && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Delimiter:</span>
                {(
                  [
                    { label: "Tab (\\t) — Quizlet Default", val: "\t" },
                    { label: "Dash ( - )", val: " - " },
                    { label: "Comma (,)", val: "," },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setExportTermDelim(opt.val)}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] transition ${
                      exportTermDelim === opt.val
                        ? "bg-accent/15 border-accent/40 text-accent-soft font-semibold"
                        : "bg-elevated border-line text-muted hover:text-fg"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <textarea
              readOnly
              value={exportText}
              rows={10}
              dir="auto"
              className="font-faruma w-full rounded-2xl bg-elevated border border-line p-4 text-xs sm:text-sm text-fg-soft leading-[1.9] focus:outline-none focus:border-accent"
            />

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-elevated hover:bg-elevated-hover border border-line text-fg text-xs font-semibold transition active:scale-95"
              >
                {copiedExport ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-success">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-accent" />
                    <span>Copy {exportFormat === "json" ? "JSON" : "Quizlet Text"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadExport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download .{exportFormat === "json" ? "json" : "txt"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= IMPORT / CREATE / EDIT FORM ================= */
          <div className="p-6 overflow-y-auto space-y-4">
            {/* 1. Deck Title Input + Upload .txt / .csv File Button */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  {lang === "dv" ? "ޑެކްގެ ނަން (Deck Title)" : "Deck Title"}
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    lang === "dv"
                      ? "މިސާލު: ދިވެހި ބަސްކޮށާރު U6-U8"
                      : "e.g., Dhivehi Vocabulary Unit 6 / Biology Terms..."
                  }
                  className="font-faruma w-full px-4 py-2.5 rounded-2xl bg-elevated border border-line text-sm text-fg placeholder:text-muted-soft focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.tsv,.json,text/plain,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-elevated hover:bg-elevated-hover border border-line text-fg text-xs font-semibold transition whitespace-nowrap active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-accent" />
                  <span>{lang === "dv" ? "ފައިލް އަޕްލޯޑް (.txt / .csv)" : "Upload .txt / .csv"}</span>
                </button>
              </div>
            </div>

            {uploadStatus && (
              <div className="text-xs text-accent-soft bg-accent-glow border border-accent/25 rounded-2xl px-3.5 py-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {/* 2. Delimiter Selectors + Swap Term & Definition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-elevated border border-line">
              {/* Between Term & Definition */}
              <div className="space-y-2">
                <span className="block text-[11px] uppercase tracking-wider text-muted font-bold">
                  Between Term &amp; Definition
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {(
                    [
                      { id: "tab", label: "Tab (\\t) • Quizlet" },
                      { id: "dash", label: "Dash ( - )" },
                      { id: "comma", label: "Comma (,)" },
                      { id: "custom", label: "Custom" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTermDelim(opt.id)}
                      className={`py-1.5 px-2.5 rounded-xl border text-left transition font-medium ${
                        termDelim === opt.id
                          ? "bg-accent/20 border-accent text-accent-soft font-semibold"
                          : "bg-surface border-line text-muted hover:text-fg"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {termDelim === "custom" && (
                  <input
                    type="text"
                    value={customTermDelim}
                    onChange={(e) => setCustomTermDelim(e.target.value)}
                    placeholder="Custom delimiter (e.g. :: or |)"
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-line text-xs text-fg focus:outline-none focus:border-accent"
                  />
                )}
              </div>

              {/* Between Rows */}
              <div className="space-y-2">
                <span className="block text-[11px] uppercase tracking-wider text-muted font-bold">
                  Between Rows (Cards)
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {(
                    [
                      { id: "newline", label: "New line (\\n)" },
                      { id: "double-newline", label: "Double line (\\n\\n)" },
                      { id: "semicolon", label: "Semicolon (;)" },
                      { id: "custom", label: "Custom" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRowDelim(opt.id)}
                      className={`py-1.5 px-2.5 rounded-xl border text-left transition font-medium ${
                        rowDelim === opt.id
                          ? "bg-accent/20 border-accent text-accent-soft font-semibold"
                          : "bg-surface border-line text-muted hover:text-fg"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {rowDelim === "custom" && (
                  <input
                    type="text"
                    value={customRowDelim}
                    onChange={(e) => setCustomRowDelim(e.target.value)}
                    placeholder="Custom row separator"
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-line text-xs text-fg focus:outline-none focus:border-accent"
                  />
                )}
              </div>
            </div>

            {/* 3. Paste Textarea + Swap Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted">
                  {lang === "dv"
                    ? "Quizlet ނުވަތަ ލިސްޓު ކޮޕީކޮށްފައި މިތަނަށް ޕޭސްޓްކޮށްލާ"
                    : "Paste from Quizlet, Word, or Google Docs"}
                </label>

                <button
                  type="button"
                  onClick={handleSwapSides}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold transition ${
                    isSwapped
                      ? "bg-accent/20 border-accent text-accent-soft"
                      : "bg-elevated border-line text-muted hover:text-fg hover:border-line-strong"
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-accent" />
                  <span>Swap Term &amp; Def</span>
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const updated =
                      rawText.substring(0, start) + "\t" + rawText.substring(end);
                    setRawText(updated);
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 1;
                    });
                  }
                }}
                rows={6}
                dir="auto"
                placeholder={placeholderExample}
                className="font-faruma w-full rounded-2xl bg-elevated border border-line p-4 text-xs sm:text-sm text-fg placeholder:text-muted-soft leading-[1.9] focus:outline-none focus:border-accent"
              />
              <p className="text-[11px] text-muted-soft">
                Tip: In Quizlet, click <span className="text-muted">⋯ → Export → Copy text</span>, then paste directly above. Pressing <kbd className="px-1 py-0.5 rounded bg-surface border border-line text-muted font-mono">Tab</kbd> inserts a real tab separator.
              </p>
            </div>

            {/* 4. Live Preview List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-accent-soft">
                Live Preview ({parsedCards.length}{" "}
                {parsedCards.length === 1 ? "card" : "cards"} parsed)
              </span>

              {parsedCards.length > 0 ? (
                <div className="max-h-52 overflow-y-auto rounded-2xl bg-elevated border border-line divide-y divide-line">
                  {parsedCards.map((c) => {
                    const tDir = getTextDir(c.term);
                    const dDir = getTextDir(c.definition);
                    return (
                      <div
                        key={c.id}
                        className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center text-xs sm:text-sm"
                      >
                        <div className="sm:col-span-1 font-mono text-[11px] text-muted">
                          #{String(c.id).padStart(2, "0")}
                        </div>
                        <div
                          dir={tDir}
                          className="sm:col-span-4 font-faruma font-bold text-fg leading-[1.85] break-words"
                        >
                          {c.term}
                        </div>
                        <div
                          dir={dDir}
                          className="sm:col-span-7 font-faruma text-fg-soft leading-[1.85] break-words border-t sm:border-t-0 sm:border-l border-line pt-1 sm:pt-0 sm:pl-3"
                        >
                          {c.definition}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-elevated border border-dashed border-line py-6 px-4 text-center text-xs text-muted-soft">
                  Paste text or upload a <span className="text-muted">.txt / .csv</span> file above to preview parsed cards live.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MODAL FOOTER ================= */}
        {activeMode !== "export" && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-t border-line bg-surface">
            <div>
              {activeMode === "edit" && (
                <button
                  type="button"
                  onClick={() => {
                    const confirmMsg = targetDeck.isBuiltIn
                      ? `Reset "${targetDeck.title}" back to default built-in cards?`
                      : `Delete custom deck "${targetDeck.title}"? This cannot be undone.`;
                    if (window.confirm(confirmMsg)) {
                      onDeleteDeck(targetDeck.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/25 text-danger text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{targetDeck.isBuiltIn ? "Reset to Default" : "Delete Deck"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-elevated hover:bg-elevated-hover border border-line text-muted hover:text-fg text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={parsedCards.length === 0}
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                {activeMode === "edit" ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Changes ({parsedCards.length})</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Deck ({parsedCards.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
