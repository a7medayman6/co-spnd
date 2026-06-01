export interface ParsedTransaction {
  amount: number | null
  category: string
  description: string
  date: string
  isCredit: boolean
}

export interface ParserKeyword {
  keyword: string
  category: string
}

const STORAGE_KEY = 'co_spnd_parser_keywords'

export const DEFAULT_KEYWORDS: ParserKeyword[] = [
  { keyword: 'restaurant', category: 'Food' },
  { keyword: 'cafe', category: 'Food' },
  { keyword: 'coffee', category: 'Food' },
  { keyword: 'pizza', category: 'Food' },
  { keyword: 'burger', category: 'Food' },
  { keyword: 'lunch', category: 'Food' },
  { keyword: 'dinner', category: 'Food' },
  { keyword: 'breakfast', category: 'Food' },
  { keyword: 'uber', category: 'Transport' },
  { keyword: 'careem', category: 'Transport' },
  { keyword: 'taxi', category: 'Transport' },
  { keyword: 'fuel', category: 'Transport' },
  { keyword: 'petrol', category: 'Transport' },
  { keyword: 'metro', category: 'Transport' },
  { keyword: 'hotel', category: 'Accommodation' },
  { keyword: 'airbnb', category: 'Accommodation' },
  { keyword: 'hostel', category: 'Accommodation' },
  { keyword: 'cinema', category: 'Entertainment' },
  { keyword: 'netflix', category: 'Entertainment' },
  { keyword: 'spotify', category: 'Entertainment' },
  { keyword: 'carrefour', category: 'Shopping' },
  { keyword: 'amazon', category: 'Shopping' },
  { keyword: 'mall', category: 'Shopping' },
  { keyword: 'pharmacy', category: 'Health' },
  { keyword: 'clinic', category: 'Health' },
  { keyword: 'hospital', category: 'Health' },
  { keyword: 'supermarket', category: 'Groceries' },
  { keyword: 'hypermarket', category: 'Groceries' },
  { keyword: 'grocery', category: 'Groceries' },
  { keyword: 'spinneys', category: 'Groceries' },
  { keyword: 'takeaway', category: 'Takeaway' },
  { keyword: 'delivery', category: 'Takeaway' },
  { keyword: 'talabat', category: 'Takeaway' },
  { keyword: 'instashop', category: 'Takeaway' },
  { keyword: 'electricity', category: 'Utilities' },
  { keyword: 'water bill', category: 'Utilities' },
  { keyword: 'internet', category: 'Utilities' },
  { keyword: 'gas bill', category: 'Utilities' },
  { keyword: 'rent', category: 'Bills' },
  { keyword: 'insurance', category: 'Bills' },
  { keyword: 'subscription', category: 'Subscriptions' },
  { keyword: 'netflix', category: 'Subscriptions' },
  { keyword: 'spotify', category: 'Subscriptions' },
  { keyword: 'apple', category: 'Subscriptions' },
  { keyword: 'google play', category: 'Subscriptions' },
]

export function getParserKeywords(): ParserKeyword[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as ParserKeyword[]
    } catch {}
  }
  return DEFAULT_KEYWORDS
}

export function saveParserKeywords(keywords: ParserKeyword[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords))
}

export function resetParserKeywords(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

function extractAmount(text: string): number | null {
  const candidates = [
    // Currency symbol before: EGP 245.50  /  $1,234.00
    /(?:EGP|USD|AED|SAR|EUR|GBP|LE|£|\$|€)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i,
    // Currency symbol after: 245.50 EGP
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:EGP|USD|AED|SAR|EUR|GBP|LE)/i,
    // Labelled: "amount: 245.50", "charged 245.50", etc.
    /(?:amount|total|paid|spent|debited|charged|deducted|purchase)[:\s]+(?:[A-Z]{2,3}\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i,
    // Any number with exactly 2 decimal places — strong signal
    /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/,
    // Fall back: any standalone number ≥ 2 digits
    /\b(\d{2,7}(?:\.\d{1,2})?)\b/,
  ]
  for (const pattern of candidates) {
    const m = text.match(pattern)
    if (m?.[1]) {
      const val = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(val) && val > 0) return val
    }
  }
  return null
}

function extractCategory(text: string, keywords: ParserKeyword[]): string {
  const lower = text.toLowerCase()
  for (const { keyword, category } of keywords) {
    if (lower.includes(keyword.toLowerCase())) return category
  }
  return 'Other'
}

function extractDate(text: string): string {
  const today = new Date().toISOString().slice(0, 10)

  // ISO: 2026-05-28
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]

  // 28-May-2026 / 28 May 2026 / 28/May/2026
  const dmy = text.match(
    /(\d{1,2})[-\s/](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[-\s/,]*(\d{4})/i,
  )
  if (dmy) {
    const d = dmy[1].padStart(2, '0')
    const m = MONTH_MAP[dmy[2].toLowerCase().slice(0, 3)]
    return `${dmy[3]}-${m}-${d}`
  }

  // May 28, 2026
  const mdy = text.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i,
  )
  if (mdy) {
    const m = MONTH_MAP[mdy[1].toLowerCase().slice(0, 3)]
    const d = mdy[2].padStart(2, '0')
    return `${mdy[3]}-${m}-${d}`
  }

  // DD/MM/YYYY
  const slash = text.match(/\b(\d{1,2})[/](\d{1,2})[/](\d{4})\b/)
  if (slash) {
    return `${slash[3]}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`
  }

  return today
}

function extractDescription(text: string): string {
  // "at Costa Coffee on …"
  const atMerchant = text.match(
    /\bat\s+([A-Z][A-Za-z0-9\s&'.,-]{2,40}?)(?:\s+on\b|\s+dated|\s+for\b|[,.]|$)/i,
  )
  if (atMerchant) return atMerchant[1].trim()

  // "POS transaction at …" / "POS purchase at …"
  const pos = text.match(
    /POS\s+(?:purchase\s+at\s+|transaction\s+at\s+|at\s+)?([A-Z0-9][A-Za-z0-9\s&'.,-]{2,40}?)(?:\s+on\b|[,.]|$)/i,
  )
  if (pos) return pos[1].trim()

  // "for <Merchant>" at end
  const forMerchant = text.match(/\bfor\s+([A-Z][A-Za-z0-9\s&'.]{2,40}?)(?:\s+on\b|[,.]|$)/i)
  if (forMerchant) return forMerchant[1].trim()

  return ''
}

const CREDIT_RE =
  /\b(credited|credit|refunded|refund|received|cashback|reversal|added to your|returned)\b/i

// ─── main export ─────────────────────────────────────────────────────────────

export function parseMessage(text: string, keywords?: ParserKeyword[]): ParsedTransaction {
  const kw = keywords ?? getParserKeywords()
  return {
    amount: extractAmount(text),
    category: extractCategory(text, kw),
    description: extractDescription(text),
    date: extractDate(text),
    isCredit: CREDIT_RE.test(text),
  }
}
