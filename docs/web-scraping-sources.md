# Web Scraping Sources Analysis

## Fonti Identificate per Web Scraping

### 1. **Exibart** (exibart.com)
- **URL**: https://www.exibart.com/bandi-e-concorsi/
- **Tipo**: Portale aggregatore di bandi culturali italiani
- **Struttura**: 
  - Pagina principale con lista bandi paginata (37 pagine)
  - Articoli con titolo, data, descrizione breve
  - Link a articoli dettagliati
- **Selettori CSS**: 
  - Articoli: `.td-module-container` o `article`
  - Titolo: `h3.entry-title` o `a.entry-title-link`
  - Data: `.td-post-date` o `time`
  - Descrizione: `.td-excerpt` o `.entry-summary`
- **Paginazione**: Numerata (1, 2, 3, ... 37)
- **Frequenza aggiornamento**: Giornaliera (ultimi bandi: 1 giugno 2026)
- **Dati estratti**: Titolo, data pubblicazione, descrizione breve, link articolo

### 2. **Ministero della Cultura (MiBACT)** (cultura.gov.it)
- **URL**: https://cultura.gov.it/comunicati/bandi-e-concorsi
- **Tipo**: Portale ufficiale italiano per bandi culturali
- **Struttura**:
  - Lista bandi con filtri (grid/list view)
  - Articoli con titolo, data, descrizione
  - Paginazione numerata (1-22 pagine)
- **Selettori CSS**:
  - Articoli: `.card-item` o `.bando-item`
  - Titolo: `.card-title` o `h3`
  - Data: `.card-date` o `time`
  - Descrizione: `.card-description` o `p`
- **Tipo bandi**: Bandi ufficiali, Avvisi, Procedure di gara
- **Dati estratti**: Titolo, tipo (Bando/Avviso), data, descrizione, link

### 3. **Fondazione Cariplo** (fondazionecariplo.it)
- **URL**: https://www.fondazionecariplo.it/contributi/bandi/
- **Tipo**: Fondazione privata con bandi culturali e sociali
- **Struttura**: Lista bandi con filtri per categoria
- **Dati estratti**: Titolo, scadenza, categoria, importo finanziamento

### 4. **Fondazione Sicilia** (fondazionesicilia.it)
- **URL**: https://www.fondazionesicilia.it/
- **Tipo**: Fondazione regionale siciliana
- **Struttura**: Sezione bandi tematici
- **Dati estratti**: Titolo, scadenza, tema, importo

### 5. **Piattaforme Europee**
- **Art Explora**: https://artexplora.plateformecandidature.com/ (residenze artistiche)
- **EMAP**: https://call.emare.eu/ (residenze media art)
- **ARTE France**: https://projets.arte.tv/en (audiovisivi)

## Strategie di Scraping

### Approcci Tecnici

#### 1. **Scraping Statico (Cheerio)**
- Per siti con HTML statico (Exibart, MiBACT)
- Veloce e leggero
- Parsing con selettori CSS

#### 2. **Scraping Dinamico (Puppeteer)**
- Per siti con JavaScript rendering
- Necessario per piattaforme con infinite scroll
- Più lento ma completo

#### 3. **Parsing Intelligente**
- Estrazione campi standard: titolo, data, scadenza, descrizione, link
- Normalizzazione date (DD/MM/YYYY → ISO 8601)
- Estrazione importo finanziamento (se presente)
- Identificazione tipo bando (residenza, premio, mostra, ecc.)

## Campi Estratti Standard

```typescript
interface ScrapedCall {
  title: string;              // Titolo bando
  description: string;        // Descrizione breve
  source: string;             // Fonte (exibart, mibact, ecc.)
  sourceUrl: string;          // URL articolo/bando
  publishedAt: Date;          // Data pubblicazione
  deadline: Date;             // Data scadenza
  callType?: string;          // Tipo (residenza, premio, mostra, ecc.)
  budget?: number;            // Importo finanziamento
  entity?: string;            // Ente organizzatore
  country?: string;           // Paese (IT, EU, ecc.)
  tags?: string[];            // Tag categoria
  fullContent?: string;       // Contenuto completo (opzionale)
}
```

## Piano Implementazione

### Fase 1: Scraper Core
- Implementare classe base `WebScraper` con Cheerio
- Implementare classe `PuppeteerScraper` per siti dinamici
- Gestione errori e retry logic

### Fase 2: Parser Specifici
- Parser Exibart
- Parser MiBACT
- Parser Fondazioni (Cariplo, Sicilia, ecc.)

### Fase 3: Deduplicazione
- Hash-based deduplication (titolo + data)
- Similarity matching (Levenshtein distance)
- Duplicate detection nel database

### Fase 4: Job Scheduler
- Cron job per scraping automatico
- Configurazione frequenza per fonte
- Logging e monitoring

### Fase 5: Integrazione
- Salvataggio nel database
- Validazione enti
- Notifiche per nuovi bandi
