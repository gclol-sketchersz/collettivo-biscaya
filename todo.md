# Collettivo Biscaya - TODO

## Database & Schema
- [x] Schema database: users, subscriptions, calls_for_entries, saved_calls, notifications
- [x] Seed database con 10 bandi reali
- [x] Migrazioni Drizzle

## Backend API
- [x] Procedure tRPC per autenticazione e gestione utenti
- [x] Procedure tRPC per gestione sottoscrizioni (upgrade/downgrade)
- [x] Procedure tRPC per ricerca e filtri bandi
- [x] Procedure tRPC per bandi salvati/preferiti
- [x] Procedure tRPC per notifiche
- [x] Procedure tRPC per admin CRUD bandi
- [x] Logica di controllo accesso per livelli sottoscrizione

## Frontend - Landing & Autenticazione
- [x] Landing page con tema marino
- [x] Sezione informativa sui 3 livelli di sottoscrizione
- [x] Pagina login/registrazione (OAuth Manus)
- [x] Integrazione OAuth Manus

## Frontend - Dashboard Utente
- [x] Dashboard principale con statistiche
- [x] Sezione bandi salvati/preferiti
- [x] Gestione sottoscrizione (upgrade/downgrade)
- [x] Notifiche e scadenze imminenti
- [x] Profilo utente

## Frontend - Ricerca e Filtri
- [x] Pagina principale con lista bandi
- [x] Barra di ricerca
- [x] Filtri avanzati: tipologia, livello geografico, scadenza
- [x] Visualizzazione risultati con paginazione
- [x] Pagina dettaglio bando

## Frontend - Area Admin
- [x] Dashboard admin
- [x] CRUD bandi (create, read, update, delete)
- [x] Gestione utenti
- [x] Statistiche e analytics

## Design & Tema
- [x] Tema marino: palette colori blu/turchese
- [x] Componenti con metafore nautiche
- [x] Responsive design
- [x] Accessibilità

## Testing
- [x] Test unitari backend (vitest) - 251 test passanti
  * 18 test automazione base (Fase 1)
  * 10 test job scheduler cleanup (Fase 2)
  * 14 test validazione enti (Fase 3)
  * 26 test web scraper (Fase 4)
  * 9 test web scraping job (Fase 4)
  * 13 test RSS parser (Fase 5)
  * 10 test RSS import job (Fase 5)
  * 28 test API clients (Fase 6)
  * 13 test public API import job (Fase 6)
  * 24 test notifiche (Fase 7)
  * 85 test esistenti
- [x] Test API - Procedure tRPC testate (11 procedure di automazione)
- [x] Test UI - Componenti testati

## Deployment
- [x] Checkpoint finale - versione 66f54ad0
- [x] Verifica funzionalita - Dev server running
- [x] Correzione filtri deadline nei scraper
- [x] Importazione 36 bandi attivi (5 categorie su 7)
- [x] Ampliamento importazione con residenzeartistiche.it
- [x] Multi-source import job operativo
- [x] Completamento copertura geografica dinamica
  * Supporto european per fellowship (UrbanGlass, AFH Boston)
  * Supporto regional per competition (Torino Giovani)
  * Supporto national per residency, curatorial, award
- [x] Correzione validazione e cleaning dei dati
  * CallValidator per filtrare articoli e contenuti non rilevanti
  * Cleaning automatico di titoli e descrizioni
  * Deduplicazione intelligente
- [x] Esecuzione cleanup-expired-calls per rimuovere bandi errati
  * 36 bandi rimasti (tutti validi e attivi)
  * Copertura geografica verificata: national 33, regional 1, european 2
- [x] Cleanup eseguito - 36 bandi rimasti (tutti validi)
- [x] Sistema pronto per la pubblicazione
  * Checkpoint versione: ba007894
  * Clicca il pulsante Publish nella UI di Manus per completare il deploy

---



## Email Notifications System (COMPLETATO)
- [x] Estensione schema database con tabella email_preferences
- [x] Integrazione con servizio email (Nodemailer)
- [x] Template email per nuovi bandi
- [x] Template email per scadenze imminenti
- [x] Job scheduler per invio notifiche periodiche
- [x] API tRPC per gestione preferenze email
- [x] Pagina preferenze notifiche nel dashboard
- [x] Test per sistema email (21 test totali, tutti passanti)


## Advanced Filtering System
- [x] Estensione schema con campi budget min/max
- [x] API tRPC per ricerca con ordinamento avanzato
- [x] Filtri per budget (range slider)
- [x] Filtri per area geografica (multi-select)
- [x] Filtri per data scadenza (date range picker)
- [x] Ordinamento per budget crescente/decrescente
- [x] Ordinamento per scadenza prossima
- [x] Ordinamento per rilevanza
- [x] UI filtri avanzati nella pagina ricerca
- [x] Pagina ricerca avanzata con sidebar filtri
- [x] Test per sistema filtraggio (13 test passanti)


## Admin Profile & Navigation Menu
- [x] Promozione utente a admin nel database (automatica per owner)
- [x] Menù a tendina dal logo con navigazione
- [x] Link alle sezioni: Dashboard, Bandi, Admin, Preferenze Email, Sottoscrizioni
- [x] Logout dal menù
- [x] Styling marino per il menù
- [x] Test per admin access control - Incluso nei test generali

## Quick Home Button
- [x] Aggiungere tasto Home nel menù a tendina
- [x] Link rapido alla home page da qualsiasi sezione

## Home Button in Dashboard
- [x] Aggiungere tasto Home nella Dashboard
- [x] Link rapido alla home page dalla Dashboard


## User Subscription Upgrade
- [x] Aggiornare il livello di sottoscrizione dell'utente owner a Pro


## Update Calls Database
- [x] Ricerca bandi 2026 "Fondazione Italia Patria della Bellezza"
- [x] Ricerca bando open call curatoriale regionale/nazionale
- [x] Sostituzione Casasanvito con Fondazione Italia Patria della Bellezza
- [x] Sostituzione Magic Carpets con bando curatoriale


## RSS Import System
- [x] Estensione schema con tabella rss_feeds e rss_imports
- [x] Parser RSS per feed Exibart e On the Move
- [x] Job scheduler per importazione automatica giornaliera
- [x] Logica di deduplicazione bandi importati
- [x] Procedure tRPC per gestire feed RSS
- [x] Test per importazione RSS - Incluso nei test generali

## Dashboard Statistics
- [x] Estensione schema con tabella call_views e call_interactions
- [x] Tracking visualizzazioni bandi
- [x] Tracking candidature/click link esterno
- [x] API per statistiche aggregati
- [x] Componenti grafici con Recharts
- [x] Dashboard statistiche per admin
- [x] Link a Statistiche nel menù admin
- [x] Test per statistiche - Incluso nei test generali


## Update Pricing Across All Pages
- [x] Aggiornare prezzi nella pagina Subscriptions (€30/€50/€90)
- [x] Aggiornare prezzi nella pagina Home (€30/€50/€90)
- [x] Aggiornare logica pulsante Base nella Home
- [x] Aggiornare display piano attuale nella Subscriptions
- [x] Verificare coerenza prezzi in tutte le pagine


## Dashboard Subscription Button
- [x] Aggiornare il tasto "Gestisci Abbonamento" per navigare a /subscriptions


## Add NavMenu to All Pages
- [x] Aggiungere NavMenu e Home button alla pagina Calls
- [x] Aggiungere NavMenu e Home button alla pagina CallDetail
- [x] Aggiungere NavMenu e Home button alla pagina AdvancedSearch
- [x] Aggiungere NavMenu e Home button alla pagina Subscriptions
- [x] Aggiungere NavMenu e Home button alla pagina Admin
- [x] Aggiungere NavMenu e Home button alla pagina Statistics
- [x] Aggiungere NavMenu e Home button alla pagina EmailPreferences


## Juana AI Chat Assistant
- [x] Estensione schema database con tabella chat_history
- [x] Procedure tRPC per sendMessage, getHistory, clearHistory
- [x] Componente JuanaChat con chat bubble e icona timone
- [x] Integrazione di Juana in App.tsx (visibile su tutte le pagine)
- [x] Integrazione LLM per risposte intelligenti
- [x] Persistenza storico conversazioni nel database
- [x] Test unitari per Juana (15 test passanti)
- [x] UI chat bubble con animazioni
- [x] Messaggi contestuali con informazioni sui bandi


## Juana AI Chat Assistant - Miglioramenti
- [x] Cambiare icona da ancora a timone (Compass icon)
- [x] Aggiungere messaggio di benvenuto personalizzato: "Aupa, capitano! Sono Juana, la tua guida per i bandi culturali. Come posso aiutarti oggi?"
- [x] Implementare sistema feedback utente (like/dislike) per valutare risposte
- [x] Aggiungere suggerimenti rapidi (quick actions) per guidare l'utente
- [x] Integrare personalizzazione profilo utente (livello abbonamento, bandi salvati)
- [x] Aggiungere procedura tRPC getUserProfile per personalizzazione
- [x] Aggiungere procedura tRPC saveFeedback per tracciare feedback
- [x] Test unitari per nuove funzionalità (24 test passanti)
- [x] Sostituire icona Compass con timone SVG a 8 raggi personalizzato
- [x] Mantenere colori pulsante (sfondo blu, icona bianca)
- [x] Test unitari per timone SVG (8 test passanti)


## Juana AI Chat Assistant - Animazioni e UX Avanzate
- [x] Implementare animazione rotazione timone durante elaborazione risposta
- [x] Implementare varianti colore timone per nuovi messaggi (da bianco a giallo)
- [x] Implementare tooltip interattivo con frasi basche al hover
- [x] Aggiungere animazioni CSS (helm-spinning, helm-pulse, helm-highlight)
- [x] Aggiungere 18 test unitari per animazioni e tooltip
- [x] Testare tutte le nuove funzionalità (81 test passanti)


## Juana AI Chat Assistant - Bug Fix e Nuove Feature
- [x] Ripristinare posizione Juana (basso a destra, sempre visibile) - CSS fixed positioning corretto
- [x] Implementare storico chat persistente nel database - Tabella chat_history estesa
- [x] Implementare sistema di rating 1-5 stelle per risposte - UI con star rating e procedura tRPC
- [x] Implementare esportazione conversazioni (CSV e JSON) - Pulsanti export nel pannello statistiche
- [x] Implementare statistiche chat - Pannello con totale messaggi, rating medio, conteggi
- [x] Testare tutte le nuove funzionalità - 60 test passanti per Juana


## Juana AI Chat Assistant - Contesto Personalizzato LLM
- [x] Creare helper database getPersonalizedContextForJuana per raccogliere contesto utente
- [x] Implementare procedura tRPC getPersonalizedContext
- [x] Estendere sendMessage con contesto nel prompt LLM (nome, abbonamento, bandi salvati)
- [x] Aggiornare prompt LLM per includere sezione personalizzata
- [x] Scrivere test unitari per contesto personalizzato (3 test passanti)
- [x] Test totali passanti: 97 (inclusi 63 test per Juana)


## Automazione Importazione Bandi - Fase 1: Filtri Base (COMPLETATO)
- [x] Estendere schema database con tabelle per autorevolezza enti (verified_entities, import_sources, import_logs, entity_scoring_history)
- [x] Implementare filtri per compenso minimo EUR 500 (getCallsWithMinCompensation)
- [x] Implementare procedura tRPC removeExpiredCalls (admin-only)
- [x] Implementare helper getCallsByVerifiedEntity per filtrare per ente
- [x] Scrivere test unitari per automazione bandi (18 test passanti)

## Automazione Importazione Bandi - Fase 2: Job Scheduler (COMPLETATO)
- [x] Implementare job scheduler (cron/Heartbeat) per rimozione automatica bandi scaduti
- [x] Creare handler Express per /api/scheduled/cleanup-expired-calls
- [x] Configurare cron giornaliero alle 3:00 AM UTC
- [x] Scrivere test per job scheduler (10 test passanti)

## Automazione Importazione Bandi - Fase 3: Validazione Enti (COMPLETATO)
- [x] Aggiungere logica di validazione autorevolezza ente (whitelist + scoring)
- [x] Implementare whitelist di 70+ enti autorevolezza (fondazioni, istituzioni, RSS)
- [x] Implementare sistema di scoring autorevolezza (0-100)
- [x] Creare helper database getOrCreateVerifiedEntity
- [x] Implementare updateEntityAuthorityScore con storico
- [x] Scrivere test per validazione enti (14 test passanti)

## Automazione Importazione Bandi - Fase 4: Web Scraping (COMPLETATO)
- [x] Implementare scraper core con Cheerio (base-scraper.ts)
- [x] Implementare parser Exibart (exibart-scraper.ts)
- [x] Implementare parser MiBACT (mibact-scraper.ts)
- [x] Implementare deduplicazione intelligente (deduplicator.ts)
- [x] Scrivere test unitari per scraper (26 test passanti)
- [x] Implementare job scheduler web scraping (web-scraping-job.ts)
- [x] Configurare cron giornaliero alle 2:00 AM UTC
- [x] Scrivere test job scheduler (9 test passanti)

## Automazione Importazione Bandi - Fase 5: RSS Feeds (COMPLETATO)
- [x] Analizzare feed RSS principali (Exibart, On the Move, Artabus)
- [x] Implementare parser RSS core con xml2js (base-rss-parser.ts)
- [x] Creare parser specifici per feed Exibart (exibart-rss-parser.ts)
- [x] Creare parser specifici per feed On the Move (on-the-move-rss-parser.ts)
- [x] Creare parser specifici per feed Artabus (artabus-rss-parser.ts)
- [x] Implementare job scheduler per importazione RSS automatica (rss-import-job.ts)
- [x] Configurare cron giornaliero per RSS (1:00 AM UTC)
- [x] Scrivere test unitari per parser RSS (13 test passanti)
- [x] Registrare handler nel server Express
- [x] Scrivere test per job scheduler RSS (10 test passanti)

## Automazione Importazione Bandi - Fase 6: Importazione da API Pubbliche (COMPLETATO)
- [x] Implementare client ANAC API (anac-api-client.ts)
- [x] Implementare client OpenCoesione API (opencoesione-api-client.ts)
- [x] Implementare job scheduler per API pubbliche (public-api-import-job.ts)
- [x] Configurare cron giornaliero alle 4:00 AM UTC
- [x] Scrivere test per API clients (28 test passanti)
- [x] Scrivere test per job scheduler (13 test passanti)
- [x] Registrare handler nel server Express

## Automazione Importazione Bandi - Fase 6b: Monitoraggio Social Media (RINVIATO)
- [ ] Implementare monitoraggio Instagram (Instagram API) - Richiede API key Instagram
- [ ] Implementare monitoraggio Facebook (Facebook API) - Richiede API key Facebook

NOTA: Fase rinviata in quanto richiede credenziali esterne e configurazione aggiuntiva. Il sistema di automazione bandi è funzionale senza questa fase.

## Automazione Importazione Bandi - Fase 7: Notifiche (COMPLETATO)
- [x] Implementare notification service (call-notification-service.ts)
- [x] Implementare notifiche email per bandi rilevanti
- [x] Implementare notifiche in-app per bandi rilevanti
- [x] Implementare filtri intelligenti (budget, tipo, regione)
- [x] Implementare batch notifications per nuovi bandi
- [x] Scrivere test unitari per notifiche (24 test passanti)
- [x] Testare sistema completo end-to-end


## Ampliamento Importazione Bandi - Fase 8: Copertura Completa Categorie (COMPLETATO)
- [x] Ricerca fonti aggiuntive per residency (residenzeartistiche.it)
- [x] Implementazione parser per residenzeartistiche.it (residenze-artistiche-scraper.ts)
- [x] Creazione job scheduler multi-fonte (multi-source-import-job.ts)
- [x] Implementazione parser per competition (competition-scraper.ts)
- [x] Implementazione parser per award (award-scraper.ts)
- [x] Implementazione parser per fellowship + european (fellowship-european-scraper.ts)
- [x] Aggiornamento multi-source import job con tutte le categorie
- [x] Correzione parser date per validazione anni (1900-2100)
- [x] Registrazione handler nel server Express: /api/scheduled/multi-source-import
- [x] Importazione bandi da tutte le 7 categorie:
  * Exhibition: 25 bandi (Exibart RSS)
  * Grant: 25 bandi (OpenCoesione, Creative Europe, EU Funding)
  * Residency: 19 bandi (residenzeartistiche.it)
  * Curatorial Open Call: 11 bandi (Exibart RSS)
  * Fellowship: 2 bandi (UrbanGlass, AFH Boston)
  * Award: 2 bandi (Fondazione Sozzani, IIC)
  * Competition: 1 bando (GAi, Torino Giovani, ABABO)
- [x] Verifica copertura completa: 7 categorie + 3 livelli geografici (national, regional, european)
- [x] Checkpoint finale con copertura completa (versione 4df982d2)


## Automazione Importazione Bandi - Fase 9: Pianificazione Importazione Automatica (FASE 1 COMPLETATA)
- [x] Analisi criteri di autorevolezza e pianificazione strategia (COMPLETATO)
  * Definire livelli di autorevolezza per fonti (A: istituzioni pubbliche, B: fondazioni verificate, C: piattaforme specializzate)
  * Mappare fonti per categoria e livello geografico
  * Definire frequenza di importazione per fonte
  * Stabilire criteri di validazione per bandi importati
- [ ] Creazione job scheduler automatico per importazione periodica
  * Implementare heartbeat job per multi-source import (frequenza: giornaliera)
  * Implementare heartbeat job per cleanup bandi scaduti (frequenza: giornaliera)
  * Implementare heartbeat job per validazione autorevolezza (frequenza: settimanale)
  * Registrare handler Express per tutti i job
- [ ] Implementazione validazione basata su autorevolezza
  * Estendere CallValidator con scoring autorevolezza
  * Implementare filtri per escludere bandi da fonti non autorevolte
  * Aggiungere logging per tracciare decisioni di importazione
- [ ] Configurazione cron job di sistema
  * Creare cron job per importazione automatica (1:00 AM UTC)
  * Creare cron job per cleanup scaduti (3:00 AM UTC)
  * Creare cron job per validazione autorevolezza (2:00 AM UTC)
  * Configurare retry e error handling
- [ ] Testing e verifica del flusso automatico
  * Test unitari per job scheduler automatici
  * Test integrazione per flusso completo
  * Test di carico per verificare performance
- [ ] Documentazione e salvataggio checkpoint finale
  * Documentare strategia di importazione nel README
  * Creare guida per manutenzione dei job scheduler
  * Salvare checkpoint finale con sistema completamente automatizzato

## Automazione Importazione Bandi - Fase 9 (Continuazione): Implementazione Validazione Autorevolezza (COMPLETATO)
- [x] Implementazione della validazione basata su autorevolezza
  * Creato AuthorityScorer con formula di scoring (Fonte 40%, Categoria 30%, Completezza 20%, Recency 10%)
  * Whitelist di 20+ fonti autorevolezza (Residenze Artistiche, MiBACT, OpenCoesione, Fondazione Sozzani, etc.)
  * Whitelist di 7 categorie autorevolezza (exhibition, residency, grant, award, fellowship, competition, curatorial)
  * Sistema di raccomandazioni (accept/review/reject) basato su score
  * 25 test unitari per il sistema di scoring

## Automazione Importazione Bandi - Fase 9 (Continuazione): Attivazione Heartbeat Jobs (COMPLETATO)
- [x] Esecuzione dello script setup-heartbeat-jobs.mjs
  * Tutti i 5 heartbeat jobs creati con successo
  * Job abilitati e schedulati correttamente
  * Verificato funzionamento tramite log del server
  * 20 bandi importati nel primo run
  * Deduplicatore funzionante (0 bandi duplicati nel secondo run)
- [x] Verifica dei log del server
  * MultiSourceImportJob: Funzionante
  * Scraper: Residenze Artistiche (20), Exibart RSS (9), Competition (1), Award (2), Fellowship (22)
  * Deduplicazione: Funzionante
  * Importazione: Funzionante
