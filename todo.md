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
- [x] Test unitari backend (vitest) - 115 test passanti (inclusi 18 test di automazione)
- [x] Test API - Procedure tRPC testate
- [x] Test UI - Componenti testati

## Deployment
- [x] Checkpoint finale - versione 66f54ad0
- [x] Verifica funzionalità - Dev server running
- [ ] Pubblicazione

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

## Automazione Importazione Bandi - Fase 2: Job Scheduler e Validazione Enti
- [ ] Implementare job scheduler (cron/Heartbeat) per rimozione automatica bandi scaduti
- [ ] Aggiungere logica di validazione autorevolezza ente (whitelist + scoring)
- [ ] Collegare bandi alle verified_entities con join e validazione
- [ ] Implementare procedura tRPC per validare autorevolezza ente
- [ ] Test per job scheduler e validazione enti

## Automazione Importazione Bandi - Fase 3: Importazione da Fonti
- [ ] Implementare importazione da RSS feeds (Exibart, On the Move, ecc.)
- [ ] Implementare web scraping da siti culturali
- [ ] Implementare integrazione API pubbliche (ANAC, Fondazioni, ecc.)
- [ ] Implementare monitoraggio social media (Instagram, Facebook)
- [ ] Implementare deduplicazione bandi intelligente

## Automazione Importazione Bandi - Fase 4: Notifiche
- [ ] Implementare notifiche email per bandi rilevanti
- [ ] Implementare notifiche in-app per bandi rilevanti
- [ ] Testare sistema completo end-to-end
