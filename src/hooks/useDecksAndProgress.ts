"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  BUILT_IN_DECKS,
  DEFAULT_DECK_ID,
  FlashcardDeckData,
  FlashcardItem,
  CardSide,
} from "@/data/decks";

const CUSTOM_DECKS_KEY = "dhivehi_flashcards_custom_decks_v1";
const ACTIVE_DECK_KEY = "dhivehi_flashcards_active_deck_v1";
const PROGRESS_MAP_KEY = "dhivehi_flashcards_progress_v1";
const FRONT_SIDE_KEY = "dhivehi_flashcards_front_side_v1";
const BUILTIN_OVERRIDES_KEY = "dhivehi_flashcards_builtin_overrides_v1";

interface DeckProgressEntry {
  memorized: number[];
  favorites: number[];
  lastActiveId?: number;
}

type ProgressMap = Record<string, DeckProgressEntry>;

interface StudioSnapshot {
  customDecks: FlashcardDeckData[];
  builtinOverrides: Record<string, FlashcardDeckData>;
  activeDeckId: string;
  progressMap: ProgressMap;
  frontSide: CardSide;
}

const SERVER_SNAPSHOT: StudioSnapshot = {
  customDecks: [],
  builtinOverrides: {},
  activeDeckId: DEFAULT_DECK_ID,
  progressMap: {},
  frontSide: "term",
};

let cachedRawKey = "";
let cachedSnapshot: StudioSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const handleStorage = () => emitChange();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getClientSnapshot(): StudioSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  try {
    const rawDecks = localStorage.getItem(CUSTOM_DECKS_KEY) ?? "";
    const rawActive = localStorage.getItem(ACTIVE_DECK_KEY) ?? "";
    const rawProgress = localStorage.getItem(PROGRESS_MAP_KEY) ?? "";
    const rawFront = localStorage.getItem(FRONT_SIDE_KEY) ?? "";
    const rawOverrides = localStorage.getItem(BUILTIN_OVERRIDES_KEY) ?? "";

    const combinedKey = `${rawDecks}|||${rawActive}|||${rawProgress}|||${rawFront}|||${rawOverrides}`;
    if (combinedKey === cachedRawKey) {
      return cachedSnapshot;
    }

    let customDecks: FlashcardDeckData[] = [];
    if (rawDecks) {
      const parsed = JSON.parse(rawDecks);
      if (Array.isArray(parsed)) {
        customDecks = parsed.filter(
          (d) =>
            d &&
            typeof d.id === "string" &&
            typeof d.title === "string" &&
            Array.isArray(d.cards)
        );
      }
    }

    let builtinOverrides: Record<string, FlashcardDeckData> = {};
    if (rawOverrides) {
      const parsedOverrides = JSON.parse(rawOverrides);
      if (parsedOverrides && typeof parsedOverrides === "object") {
        builtinOverrides = parsedOverrides;
      }
    }

    let activeDeckId = DEFAULT_DECK_ID;
    if (rawActive) {
      const existsInBuiltIn = BUILT_IN_DECKS.some((d) => d.id === rawActive);
      const existsInCustom = customDecks.some((d) => d.id === rawActive);
      if (existsInBuiltIn || existsInCustom) {
        activeDeckId = rawActive;
      }
    }

    let progressMap: ProgressMap = {};
    if (rawProgress) {
      const parsedProg = JSON.parse(rawProgress);
      if (parsedProg && typeof parsedProg === "object") {
        progressMap = parsedProg;
      }
    }

    const frontSide: CardSide =
      rawFront === "definition" ? "definition" : "term";

    cachedRawKey = combinedKey;
    cachedSnapshot = {
      customDecks,
      builtinOverrides,
      activeDeckId,
      progressMap,
      frontSide,
    };
    return cachedSnapshot;
  } catch {
    return SERVER_SNAPSHOT;
  }
}

function getServerSnapshot(): StudioSnapshot {
  return SERVER_SNAPSHOT;
}

export function useDecksAndProgress() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const { customDecks, builtinOverrides, activeDeckId, progressMap, frontSide } = snapshot;

  const allDecks = useMemo(() => {
    const builtInResolved = BUILT_IN_DECKS.map((bd) => {
      const override = builtinOverrides[bd.id];
      if (override && Array.isArray(override.cards)) {
        return {
          ...bd,
          title: override.title || bd.title,
          titleDv: override.titleDv ?? bd.titleDv,
          cards: override.cards,
          updatedAt: override.updatedAt || bd.updatedAt,
        };
      }
      return bd;
    });
    return [...builtInResolved, ...customDecks];
  }, [builtinOverrides, customDecks]);

  const activeDeck = useMemo(
    () => allDecks.find((d) => d.id === activeDeckId) ?? allDecks[0] ?? BUILT_IN_DECKS[0],
    [allDecks, activeDeckId]
  );

  const selectDeck = useCallback((deckId: string) => {
    try {
      localStorage.setItem(ACTIVE_DECK_KEY, deckId);
      emitChange();
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setFrontSide = useCallback((side: CardSide) => {
    try {
      localStorage.setItem(FRONT_SIDE_KEY, side);
      emitChange();
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleFrontSide = useCallback(() => {
    const current = getClientSnapshot().frontSide;
    const next: CardSide = current === "term" ? "definition" : "term";
    try {
      localStorage.setItem(FRONT_SIDE_KEY, next);
      emitChange();
    } catch {
      // Ignore storage errors
    }
  }, []);

  const createDeck = useCallback(
    (title: string, cards: FlashcardItem[]): FlashcardDeckData => {
      const now = Date.now();
      const normalizedCards = cards.map((c, idx) => ({
        id: idx + 1,
        term: c.term.trim(),
        definition: c.definition.trim(),
      }));
      const newDeck: FlashcardDeckData = {
        id: `custom-${now}-${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim() || "Untitled Deck",
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
        cards: normalizedCards,
      };
      const currentDecks = getClientSnapshot().customDecks;
      const nextDecks = [...currentDecks, newDeck];
      try {
        localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(nextDecks));
        localStorage.setItem(ACTIVE_DECK_KEY, newDeck.id);
        emitChange();
      } catch {
        // Ignore storage errors
      }
      return newDeck;
    },
    []
  );

  const updateDeck = useCallback(
    (deckId: string, title: string, cards: FlashcardItem[]) => {
      const now = Date.now();
      const normalizedCards = cards.map((c, idx) => ({
        id: c.id > 0 ? c.id : idx + 1,
        term: c.term.trim(),
        definition: c.definition.trim(),
      }));
      const validIds = new Set(normalizedCards.map((c) => c.id));
      const snap = getClientSnapshot();

      const isBuiltIn = BUILT_IN_DECKS.some((b) => b.id === deckId);
      if (isBuiltIn) {
        const original = BUILT_IN_DECKS.find((b) => b.id === deckId)!;
        const nextOverrides = {
          ...snap.builtinOverrides,
          [deckId]: {
            ...original,
            title: title.trim() || original.title,
            cards: normalizedCards,
            updatedAt: now,
          },
        };
        try {
          localStorage.setItem(BUILTIN_OVERRIDES_KEY, JSON.stringify(nextOverrides));
        } catch {
          // Ignore storage errors
        }
      } else {
        const nextDecks = snap.customDecks.map((d) =>
          d.id === deckId
            ? {
                ...d,
                title: title.trim() || d.title,
                updatedAt: now,
                cards: normalizedCards,
              }
            : d
        );
        try {
          localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(nextDecks));
        } catch {
          // Ignore storage errors
        }
      }

      // Prune progress map for cards that may have been deleted
      const existingProg = snap.progressMap[deckId];
      if (existingProg) {
        const nextMap: ProgressMap = {
          ...snap.progressMap,
          [deckId]: {
            memorized: existingProg.memorized.filter((id) => validIds.has(id)),
            favorites: existingProg.favorites.filter((id) => validIds.has(id)),
          },
        };
        try {
          localStorage.setItem(PROGRESS_MAP_KEY, JSON.stringify(nextMap));
        } catch {
          // Ignore storage errors
        }
      }

      emitChange();
    },
    []
  );

  const saveCard = useCallback(
    (
      deckId: string,
      cardInput: { id?: number; term: string; definition: string }
    ): FlashcardItem => {
      const snap = getClientSnapshot();
      const isBuiltIn = BUILT_IN_DECKS.some((b) => b.id === deckId);
      let currentDeck: FlashcardDeckData | undefined;

      if (isBuiltIn) {
        currentDeck =
          snap.builtinOverrides[deckId] ?? BUILT_IN_DECKS.find((b) => b.id === deckId);
      } else {
        currentDeck = snap.customDecks.find((d) => d.id === deckId);
      }

      const currentCards = currentDeck ? [...currentDeck.cards] : [];
      let savedCard: FlashcardItem;

      if (cardInput.id !== undefined && currentCards.some((c) => c.id === cardInput.id)) {
        savedCard = {
          id: cardInput.id,
          term: cardInput.term.trim(),
          definition: cardInput.definition.trim(),
        };
        const nextCards = currentCards.map((c) =>
          c.id === cardInput.id ? savedCard : c
        );
        updateDeck(deckId, currentDeck?.title ?? "Deck", nextCards);
      } else {
        const maxId = currentCards.reduce((acc, c) => Math.max(acc, c.id), 0);
        savedCard = {
          id: maxId + 1,
          term: cardInput.term.trim(),
          definition: cardInput.definition.trim(),
        };
        const nextCards = [...currentCards, savedCard];
        updateDeck(deckId, currentDeck?.title ?? "Deck", nextCards);
      }

      return savedCard;
    },
    [updateDeck]
  );

  const deleteCard = useCallback(
    (deckId: string, cardId: number) => {
      const snap = getClientSnapshot();
      const isBuiltIn = BUILT_IN_DECKS.some((b) => b.id === deckId);
      let currentDeck: FlashcardDeckData | undefined;

      if (isBuiltIn) {
        currentDeck =
          snap.builtinOverrides[deckId] ?? BUILT_IN_DECKS.find((b) => b.id === deckId);
      } else {
        currentDeck = snap.customDecks.find((d) => d.id === deckId);
      }

      if (!currentDeck) return;
      const nextCards = currentDeck.cards.filter((c) => c.id !== cardId);
      updateDeck(deckId, currentDeck.title, nextCards);
    },
    [updateDeck]
  );

  const resetBuiltInDeck = useCallback((deckId: string) => {
    const snap = getClientSnapshot();
    if (!snap.builtinOverrides[deckId]) return;
    const nextOverrides = { ...snap.builtinOverrides };
    delete nextOverrides[deckId];
    try {
      localStorage.setItem(BUILTIN_OVERRIDES_KEY, JSON.stringify(nextOverrides));
      emitChange();
    } catch {
      // Ignore
    }
  }, []);

  const deleteDeck = useCallback(
    (deckId: string) => {
      const isBuiltIn = BUILT_IN_DECKS.some((b) => b.id === deckId);
      if (isBuiltIn) {
        resetBuiltInDeck(deckId);
        return;
      }

      const snap = getClientSnapshot();
      const nextDecks = snap.customDecks.filter((d) => d.id !== deckId);
      const nextMap = { ...snap.progressMap };
      delete nextMap[deckId];

      try {
        localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(nextDecks));
        localStorage.setItem(PROGRESS_MAP_KEY, JSON.stringify(nextMap));
        if (snap.activeDeckId === deckId) {
          localStorage.setItem(ACTIVE_DECK_KEY, DEFAULT_DECK_ID);
        }
        emitChange();
      } catch {
        // Ignore storage errors
      }
    },
    [resetBuiltInDeck]
  );

  const validDeckCardIds = useMemo(
    () => new Set(activeDeck.cards.map((c) => c.id)),
    [activeDeck.cards]
  );

  const memorized = useMemo(() => {
    const arr = progressMap[activeDeck.id]?.memorized ?? [];
    return new Set(arr.filter((id) => validDeckCardIds.has(id)));
  }, [progressMap, activeDeck.id, validDeckCardIds]);

  const favorites = useMemo(() => {
    const arr = progressMap[activeDeck.id]?.favorites ?? [];
    return new Set(arr.filter((id) => validDeckCardIds.has(id)));
  }, [progressMap, activeDeck.id, validDeckCardIds]);

  const toggleMemorized = useCallback(
    (cardId: number) => {
      const deckId = activeDeck.id;
      const snap = getClientSnapshot();
      const entry = snap.progressMap[deckId] ?? { memorized: [], favorites: [] };
      const memSet = new Set(entry.memorized);
      if (memSet.has(cardId)) {
        memSet.delete(cardId);
      } else {
        memSet.add(cardId);
      }
      const nextMap: ProgressMap = {
        ...snap.progressMap,
        [deckId]: {
          ...entry,
          memorized: Array.from(memSet),
        },
      };
      try {
        localStorage.setItem(PROGRESS_MAP_KEY, JSON.stringify(nextMap));
        emitChange();
      } catch {
        // Ignore storage errors
      }
    },
    [activeDeck.id]
  );

  const toggleFavorite = useCallback(
    (cardId: number) => {
      const deckId = activeDeck.id;
      const snap = getClientSnapshot();
      const entry = snap.progressMap[deckId] ?? { memorized: [], favorites: [] };
      const favSet = new Set(entry.favorites);
      if (favSet.has(cardId)) {
        favSet.delete(cardId);
      } else {
        favSet.add(cardId);
      }
      const nextMap: ProgressMap = {
        ...snap.progressMap,
        [deckId]: {
          ...entry,
          favorites: Array.from(favSet),
        },
      };
      try {
        localStorage.setItem(PROGRESS_MAP_KEY, JSON.stringify(nextMap));
        emitChange();
      } catch {
        // Ignore storage errors
      }
    },
    [activeDeck.id]
  );

  const resetDeckProgress = useCallback(() => {
    const deckId = activeDeck.id;
    const snap = getClientSnapshot();
    const nextMap = { ...snap.progressMap };
    delete nextMap[deckId];
    try {
      localStorage.setItem(PROGRESS_MAP_KEY, JSON.stringify(nextMap));
      emitChange();
    } catch {
      // Ignore storage errors
    }
  }, [activeDeck.id]);

  return {
    allDecks,
    customDecks,
    activeDeck,
    activeDeckId: activeDeck.id,
    selectDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    saveCard,
    deleteCard,
    resetBuiltInDeck,
    frontSide,
    setFrontSide,
    toggleFrontSide,
    memorized,
    favorites,
    toggleMemorized,
    toggleFavorite,
    resetDeckProgress,
  };
}
