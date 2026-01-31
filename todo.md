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
- [ ] Test unitari backend (vitest)
- [ ] Test API
- [ ] Test UI

## Deployment
- [ ] Checkpoint finale
- [ ] Verifica funzionalità
- [ ] Pubblicazione

---

## Email Notifications System
- [ ] Estensione schema database con tabella email_preferences
- [ ] Integrazione con servizio email (Resend o Nodemailer)
- [ ] Template email per nuovi bandi
- [ ] Template email per scadenze imminenti
- [ ] Job scheduler per invio notifiche periodiche
- [ ] API tRPC per gestione preferenze email
- [ ] Pagina preferenze notifiche nel dashboard
- [ ] Test per sistema email

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
- [ ] Test per admin access control

## Quick Home Button
- [x] Aggiungere tasto Home nel menù a tendina
- [x] Link rapido alla home page da qualsiasi sezione

## Home Button in Dashboard
- [x] Aggiungere tasto Home nella Dashboard
- [x] Link rapido alla home page dalla Dashboard
