export interface FlashcardItem {
  id: number;
  term: string;
  definition: string;
}

export interface FlashcardDeckData {
  id: string;
  title: string;
  titleDv?: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  cards: FlashcardItem[];
}

export type TermDelimiterOption = "tab" | "dash" | "comma" | "custom";
export type RowDelimiterOption = "newline" | "double-newline" | "semicolon" | "custom";
export type CardSide = "term" | "definition";

export const DEFAULT_DECK_ID = "dhivehi-baskoshaaru-u3-u5";

export const DEFAULT_BASKOSHAARU_CARDS: FlashcardItem[] = [
  { id: 1, term: "ޙުރުމަތްތެރި", definition: "މަތިވެރި / އިއްޒަތްތެރި / ކަމޭހިތާ ހިތުން" },
  { id: 2, term: "ނަލަހެދުން", definition: "ރީތި ފޭރާންލައި ޒީނަތްތެރިވުން" },
  { id: 3, term: "ނުފޫޒު", definition: "އެހެން މީހުންގެ މައްޗަށް ފޯރުވާ ބާރު" },
  { id: 4, term: "އަހުލުވެރިވުން", definition: "ކަމެއްގެ ތެރެއަށް ވައްދައި އެކަމުގެ މައުލޫމާތުދިނުން" },
  { id: 5, term: "ވާރުތަވުން", definition: "ދެމިގެން އައުން / މެދުނުކެނޑި އައިސްފައިވުން" },
  { id: 6, term: "މެހެމާނުން", definition: "ޚާއްސަ މީހުން" },
  { id: 7, term: "ފިކުރު", definition: "ހިތާމަ / ވިސްނުން / ކަމަކާމެދު ކަންބޮޑުވުން" },
  { id: 8, term: "ގިޔުގަނޑު", definition: "ފުރޭމު / އޮނިގަނޑު / ކަމަކަށް ކަނޑައެޅިފައިވާ މިންގަނޑު" },
  { id: 9, term: "ސިއްކަޖެހުން", definition: "ބަންދުކުރުން / ބަދަލުނުކުރެވުން / ބަދަލުނުގެނެވުން" },
  { id: 10, term: "ޒިންމާ", definition: "މަސްޢޫލިއްޔަތު / ކަމެއް ބޮލުގައި އެޅުން" },
  { id: 11, term: "ހީލަތްތެރި", definition: "މަކަރުވެރި، ކެހިވެރި، ހިންތާވެރި، އިޔަހޫދިވެރި" },
  { id: 12, term: "ހަމަލާ", definition: "އެކަކުގެ މައްޗަށް އަނެކަކު ދެކޮޅުވެރިވެ ކުރާ ދިމާ" },
  { id: 13, term: "އަބުރު", definition: "ހަޤީޤީ އިއްޒަތް، މާތް އަޚުލާޤް، ޤަދަރު" },
  { id: 14, term: "މީސްމީޑިއާ", definition: "ސޯޝަލް މީޑިއާ، އިޖުތިމާއީ ވިއުގަ" },
  { id: 15, term: "ފިޔަވަޅު", definition: "ކަމަކާ ބެހޭ ގޮތުން ކުރާ ޢަމަލު" },
  { id: 16, term: "ފަޟީހަތް", definition: "ބޭޒާރު، ބަދުނާމު" },
  { id: 17, term: "ދުޝްމަން", definition: "ދެކޮޅުވެރި މީހާ" },
  { id: 18, term: "ލަނޑުދަނޑި", definition: "އަމާޒުފަތްގަނޑު" },
  { id: 19, term: "ޒާތީ", definition: "އަމިއްލަ، ދެކޮޅުވެރި" },
  { id: 20, term: "ޖަރީމާ", definition: "ބޮޑެތި ކުށް" },
  { id: 21, term: "ހިންމަތް", definition: "ގަދަ ހިތްވަރު، ސާބިތުވެ ކުރާ ހިތްވަރު" },
  { id: 22, term: "ނުފޫޒު", definition: "ގަދަކަން، ބާރު" },
  { id: 23, term: "ބަރޯސާވުން", definition: "އިތުބާރުކުރުން" },
  { id: 24, term: "ބައިތުލްމާލު", definition: "ޤައުމީ ޚަޒާނާ" },
  { id: 25, term: "ކުރިބޯށި", definition: "އެންމެ ފުރިހަމަ ކާމިޔާބީ" },
  { id: 26, term: "އަގުވަޒަންކުރުން", definition: "ރަނގަޅު ގޮތުގައި ކަމެއް ފާހަގަކުރުން" },
  { id: 27, term: "މަސްހުނިވުން", definition: "ދެބަޔަކު އާންމުކޮށް ކުރަމުން އަންނަ ގޮތް އެއްގޮތްވުން" },
  { id: 28, term: "ފަންނު", definition: "ހުނަރު" },
  { id: 29, term: "ތަހުޒީބު", definition: "އާރާސްތު، ޒަމާނާ އެއްގޮތަށް ބަދަލުވާ ބަދަލުވުން، ރީތި ގޮތް" },
  { id: 30, term: "ބީރައްޓެހި", definition: "ނުރައްޓެހި، ކަމަށް ނުފަރިތަ، ތިމާގެ ރަށް ނޫން ރަށެއްގެ" },
];

export const BUILT_IN_DECKS: FlashcardDeckData[] = [
  {
    id: DEFAULT_DECK_ID,
    title: "Dhivehi Baskoshaaru U3–U5",
    titleDv: "ދިވެހި ބަސްކޮށާރު U3-U5",
    isBuiltIn: true,
    createdAt: 0,
    updatedAt: 0,
    cards: DEFAULT_BASKOSHAARU_CARDS,
  },
];

/**
 * Normalizes Arabic text for searching by removing tashkeel (diacritics/harakat),
 * tatweel, and normalizing alef/hamza forms.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

/**
 * Normalizes Dhivehi (Thaana) & bilingual text for searching.
 */
export function normalizeThaana(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Returns "rtl" when text contains Thaana or Arabic script (or no Latin letters),
 * and "ltr" only when text is purely Latin/English without RTL characters.
 */
export function getTextDir(text: string): "rtl" | "ltr" {
  if (/[\u0780-\u07BF\u0600-\u06FF]/.test(text)) {
    return "rtl";
  }
  if (/[A-Za-z]/.test(text)) {
    return "ltr";
  }
  return "rtl";
}

export function hasArabicOnly(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text) && !/[\u0780-\u07BF]/.test(text);
}

export function unescapeDelimiter(raw: string): string {
  return raw
    .replace(/\\t/g, "\t")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");
}

export function resolveTermDelimiter(
  option: TermDelimiterOption,
  custom: string
): string {
  switch (option) {
    case "tab":
      return "\t";
    case "dash":
      return " - ";
    case "comma":
      return ",";
    case "custom":
      return unescapeDelimiter(custom) || "\t";
  }
}

export function resolveRowDelimiter(
  option: RowDelimiterOption,
  custom: string
): string {
  switch (option) {
    case "newline":
      return "\n";
    case "double-newline":
      return "\n\n";
    case "semicolon":
      return ";";
    case "custom":
      return unescapeDelimiter(custom) || "\n";
  }
}

function splitCsvTwoFields(row: string): [string, string] | null {
  const trimmed = row.trim();
  if (!trimmed) return null;

  // Handle quoted CSV row e.g. "term, a","def, b"
  if (trimmed.startsWith('"')) {
    let inQuotes = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '"') {
        if (inQuotes && trimmed[i + 1] === '"') {
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        const left = unquoteCsvField(trimmed.slice(0, i));
        const right = unquoteCsvField(trimmed.slice(i + 1));
        return [left, right];
      }
    }
  }

  const idx = trimmed.indexOf(",");
  if (idx === -1) return null;
  return [
    unquoteCsvField(trimmed.slice(0, idx)),
    unquoteCsvField(trimmed.slice(idx + 1)),
  ];
}

function unquoteCsvField(val: string): string {
  const s = val.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/""/g, '"').trim();
  }
  return s;
}

export function parseDeckText(
  rawText: string,
  termOption: TermDelimiterOption,
  rowOption: RowDelimiterOption,
  customTerm: string = "",
  customRow: string = "",
  swapped: boolean = false
): FlashcardItem[] {
  if (!rawText || !rawText.trim()) return [];

  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rowDelim = resolveRowDelimiter(rowOption, customRow);
  const termDelim = resolveTermDelimiter(termOption, customTerm);

  const rawRows = normalized.split(rowDelim);
  const cards: FlashcardItem[] = [];

  for (const rawRow of rawRows) {
    const row = rawRow.trim();
    if (!row) continue;

    let left = "";
    let right = "";

    if (termOption === "comma") {
      const csvSplit = splitCsvTwoFields(row);
      if (!csvSplit) continue;
      [left, right] = csvSplit;
    } else if (termOption === "dash") {
      // Primary: spaced hyphen " - ", fallback to spaced em-dash " — " or en-dash " – "
      let idx = row.indexOf(" - ");
      let sepLen = 3;
      if (idx === -1) {
        idx = row.indexOf(" — ");
        sepLen = 3;
      }
      if (idx === -1) {
        idx = row.indexOf(" – ");
        sepLen = 3;
      }
      if (idx === -1) continue;
      left = row.slice(0, idx).trim();
      right = row.slice(idx + sepLen).trim();
    } else {
      const idx = row.indexOf(termDelim);
      if (idx === -1) continue;
      left = row.slice(0, idx).trim();
      right = row.slice(idx + termDelim.length).trim();
    }

    if (!left && !right) continue;
    if (!left || !right) continue;

    const term = swapped ? right : left;
    const definition = swapped ? left : right;

    cards.push({
      id: cards.length + 1,
      term,
      definition,
    });
  }

  return cards;
}

export function serializeDeckText(
  cards: FlashcardItem[],
  termDelim: string = "\t",
  rowDelim: string = "\n"
): string {
  return cards.map((c) => `${c.term}${termDelim}${c.definition}`).join(rowDelim);
}

/**
 * Selects up to `count` cards from a deck ensuring no collisions on duplicate
 * terms or definitions (e.g. duplicate vocabulary words with different meanings).
 */
export function pickUniqueCards(cards: FlashcardItem[], count: number): FlashcardItem[] {
  if (cards.length <= count) {
    return [...cards];
  }

  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected: FlashcardItem[] = [];
  const seenTerms = new Set<string>();
  const seenDefs = new Set<string>();

  for (const card of shuffled) {
    const t = card.term.trim().toLowerCase();
    const d = card.definition.trim().toLowerCase();
    if (seenTerms.has(t) || seenDefs.has(d)) continue;
    seenTerms.add(t);
    seenDefs.add(d);
    selected.push(card);
    if (selected.length === count) break;
  }

  if (selected.length < count) {
    for (const card of shuffled) {
      if (!selected.some((s) => s.id === card.id)) {
        selected.push(card);
        if (selected.length === count) break;
      }
    }
  }

  return selected;
}

