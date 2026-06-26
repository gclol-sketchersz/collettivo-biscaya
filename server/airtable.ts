/**
 * Airtable API client for fetching cultural calls (bandi) from an Airtable base.
 * Uses the Airtable REST API with a Personal Access Token.
 *
 * Required env vars:
 *  - AIRTABLE_API_KEY       – Personal Access Token (pat...)
 *  - AIRTABLE_BASE_ID       – e.g. "appXXXXXXXXXXXXXX"
 *  - AIRTABLE_TABLE_NAME    – e.g. "Bandi" (table name as shown in Airtable)
 *  - AIRTABLE_USERS_TABLE   – e.g. "Utenti" (users table name)
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";

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

// ---------------------------------------------------------------------------
// User auth (Airtable users table)
// ---------------------------------------------------------------------------

export type AirtableUser = {
  recordId: string;
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "admin";
};

function getUsersTableName(): string {
  return process.env.AIRTABLE_USERS_TABLE || "Utenti";
}

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashNewPassword(password: string): string {
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const candidate = hashPassword(password, salt);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

async function airtableRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const env = getEnv();
  if (!env) throw new Error("Airtable non configurato: variabili AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME mancanti.");

  const res = await fetch(`${AIRTABLE_API_URL}/v0/${env.baseId}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) {
      const tableName = decodeURIComponent(path.split("?")[0]);
      throw new Error(`Tabella Airtable '${tableName}' non trovata. Verifica il nome della tabella in AIRTABLE_USERS_TABLE.`);
    }
    if (res.status === 401 || res.status === 403) throw new Error("Chiave API Airtable non valida o permessi insufficienti. Verifica AIRTABLE_API_KEY.");
    if (res.status === 422) throw new Error(`Dati non validi per Airtable. Verifica che i campi email, name, passwordHash, role esistano nella tabella. Dettagli: ${text}`);
    throw new Error(`Errore Airtable ${method} ${res.status}: ${text}`);
  }

  return res.json();
}

export async function findUserByEmail(email: string): Promise<AirtableUser | null> {
  const env = getEnv();
  if (!env) throw new Error("Airtable non configurato: variabili AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME mancanti.");

  const tableName = getUsersTableName();
  const url = new URL(`${AIRTABLE_API_URL}/v0/${env.baseId}/${encodeURIComponent(tableName)}`);
  url.searchParams.set("filterByFormula", `{email}="${email.toLowerCase()}"`);
  url.searchParams.set("maxRecords", "1");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error(`Tabella Airtable '${tableName}' non trovata. Verifica AIRTABLE_USERS_TABLE.`);
    if (res.status === 401 || res.status === 403) throw new Error("Chiave API Airtable non valida o permessi insufficienti.");
    throw new Error(`Errore Airtable ${res.status}: ${text}`);
  }

  const data = (await res.json()) as AirtableListResponse;
  const record = data.records[0];
  if (!record) return null;

  return mapRecordToUser(record);
}

export async function createAirtableUser(
  email: string,
  name: string,
  passwordHash: string,
  role: "user" | "admin" = "user"
): Promise<AirtableUser> {
  const tableName = getUsersTableName();
  const data = (await airtableRequest("POST", encodeURIComponent(tableName), {
    fields: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role,
    },
  })) as AirtableRecord;

  return mapRecordToUser(data);
}

function mapRecordToUser(record: AirtableRecord): AirtableUser {
  const f = record.fields;
  const roleRaw = String(f["role"] ?? "user").toLowerCase();
  return {
    recordId: record.id,
    id: record.id,
    email: String(f["email"] ?? ""),
    name: String(f["name"] ?? ""),
    passwordHash: String(f["passwordHash"] ?? ""),
    role: roleRaw === "admin" ? "admin" : "user",
  };
}

export async function getAirtableUserById(recordId: string): Promise<AirtableUser | null> {
  const env = getEnv();
  if (!env) return null;

  const tableName = getUsersTableName();
  const res = await fetch(
    `${AIRTABLE_API_URL}/v0/${env.baseId}/${encodeURIComponent(tableName)}/${recordId}`,
    { headers: { Authorization: `Bearer ${env.apiKey}` } }
  );

  if (!res.ok) return null;

  const record = (await res.json()) as AirtableRecord;
  return mapRecordToUser(record);
}
