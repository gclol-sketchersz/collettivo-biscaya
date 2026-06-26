/**
 * Airtable API client for fetching cultural calls (bandi) from an Airtable base.
 * Uses the Airtable REST API with a Personal Access Token.
 *
 * Required env vars:
 *  - AIRTABLE_API_KEY   – Personal Access Token (pat...)
 *  - AIRTABLE_BASE_ID   – e.g. "appXXXXXXXXXXXXXX"
 *  - AIRTABLE_TABLE_NAME – e.g. "Bandi" (table name as shown in Airtable)
 */

const AIRTABLE_API_URL = "https://api.airtable.com";

export type AirtableCall = {
  id: string;
  title: string;
  entity: string;
  country: string;
  geographicLevel: "regional" | "national" | "european";
  callType:
    | "exhibition"
    | "residency"
    | "competition"
    | "grant"
    | "award"
    | "fellowship"
    | "curatorial_open_call";
  deadline: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  externalLink?: string | null;
  costs?: string | null;
  qualitativeNotes?: string | null;
  accessibility?: string | null;
  isActive: boolean;
};

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

function getEnv(): { apiKey: string; baseId: string; tableName: string } | null {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    return null;
  }

  return { apiKey, baseId, tableName };
}

function getField(record: AirtableRecord, name: string): string | null {
  const value = record.fields[name];
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : null;
  return String(value);
}

function getNumberField(record: AirtableRecord, name: string): number | null {
  const value = record.fields[name];
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function mapRecordToCall(record: AirtableRecord): AirtableCall {
  const geoRaw = getField(record, "geographicLevel") || getField(record, "Livello") || "regional";
  const typeRaw = getField(record, "callType") || getField(record, "Tipologia") || "exhibition";
  const deadlineRaw = getField(record, "deadline") || getField(record, "Scadenza") || "";

  const geo = (["regional", "national", "european"].includes(geoRaw)
    ? geoRaw
    : "regional") as AirtableCall["geographicLevel"];

  const callType = ([
    "exhibition",
    "residency",
    "competition",
    "grant",
    "award",
    "fellowship",
    "curatorial_open_call",
  ].includes(typeRaw)
    ? typeRaw
    : "exhibition") as AirtableCall["callType"];

  return {
    id: record.id,
    title: getField(record, "title") || getField(record, "Title") || getField(record, "Titolo") || "Senza titolo",
    entity: getField(record, "entity") || getField(record, "Ente") || "",
    country: getField(record, "country") || getField(record, "Paese") || "",
    geographicLevel: geo,
    callType,
    deadline: deadlineRaw,
    budgetMin: getNumberField(record, "budgetMin") ?? getNumberField(record, "Budget Min"),
    budgetMax: getNumberField(record, "budgetMax") ?? getNumberField(record, "Budget Max"),
    budgetCurrency: getField(record, "budgetCurrency") || "EUR",
    requirements: getField(record, "requirements") || getField(record, "Requisiti"),
    benefits: getField(record, "benefits") || getField(record, "Benefici"),
    externalLink: getField(record, "externalLink") || getField(record, "Link"),
    costs: getField(record, "costs") || getField(record, "Costi"),
    qualitativeNotes: getField(record, "qualitativeNotes") || getField(record, "Note"),
    accessibility: getField(record, "accessibility") || getField(record, "Accessibilità"),
    isActive: true,
  };
}

async function fetchAllRecords(): Promise<AirtableCall[]> {
  const env = getEnv();
  if (!env) return [];

  const { apiKey, baseId, tableName } = env;
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/v0/${baseId}/${encodeURIComponent(tableName)}`);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[Airtable] API error:", res.status, body);
      return [];
    }

    const data = (await res.json()) as AirtableListResponse;
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords.map(mapRecordToCall);
}

let cache: { data: AirtableCall[]; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getAirtableCalls(): Promise<AirtableCall[]> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return cache.data;
  }

  const data = await fetchAllRecords();
  cache = { data, ts: now };
  return data;
}

export async function getAirtableCallById(id: string): Promise<AirtableCall | null> {
  const calls = await getAirtableCalls();
  return calls.find((c) => c.id === id) ?? null;
}

export function isAirtableConfigured(): boolean {
  return getEnv() !== null;
}
