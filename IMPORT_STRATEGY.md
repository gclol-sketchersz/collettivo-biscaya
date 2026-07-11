# Strategia di Importazione Automatica dei Bandi

## 1. Criteri di Autorevolezza

### Livello A: Istituzioni Pubbliche (Massima Autorevolezza)
**Caratteristiche:**
- Enti governativi, ministeri, agenzie pubbliche
- Finanziamenti pubblici certificati
- Trasparenza amministrativa garantita
- Deadline e termini chiari e verificabili

**Fonti:**
- MiBACT (Ministero della Cultura)
- Regioni italiane (siti ufficiali)
- Comuni e province
- ANAC (Autorità Nazionale Anticorruzione)
- OpenCoesione (Fondi europei)

**Frequenza importazione:** Giornaliera (1:00 AM UTC)
**Validazione:** Automatica (deadline, budget, descrizione)
**Filtri:** Nessuno - tutti i bandi importati

---

### Livello B: Fondazioni Verificate e Istituzioni Culturali
**Caratteristiche:**
- Fondazioni riconosciute e verificate
- Istituzioni culturali accreditate
- Biennali, musei, gallerie importanti
- Programmi di residenza consolidati

**Fonti:**
- Fondazione Sozzani
- Fondazione Italia Patria della Bellezza
- Residenze Artistiche (residenzeartistiche.it)
- Biennale di Venezia
- Musei e istituzioni culturali principali

**Frequenza importazione:** Giornaliera (1:30 AM UTC)
**Validazione:** Automatica + Scoring autorevolezza (80+/100)
**Filtri:** Budget minimo EUR 500 (consigliato)

---

### Livello C: Piattaforme Specializzate e Media
**Caratteristiche:**
- Piattaforme di aggregazione bandi specializzate
- Media culturali affidabili
- Community di artisti verificate
- Siti di networking artistico

**Fonti:**
- Exibart (RSS feed)
- On the Move (RSS feed)
- Artabus (RSS feed)
- Piattaforme di call internazionali

**Frequenza importazione:** Giornaliera (2:00 AM UTC)
**Validazione:** Automatica + Scoring autorevolezza (60+/100)
**Filtri:** Escludere articoli/notizie, validare deadline

---

## 2. Mappatura Fonti per Categoria

| Categoria | Fonti Livello A | Fonti Livello B | Fonti Livello C | Copertura Geografica |
|-----------|-----------------|-----------------|-----------------|----------------------|
| **Exhibition** | MiBACT | Biennale, Musei | Exibart RSS | National, Regional |
| **Grant** | OpenCoesione, EU Funding | Fondazioni | Artabus | National, European |
| **Residency** | Regioni | Residenze Artistiche | On the Move | National, Regional |
| **Award** | Ministeri | Fondazioni verificate | Exibart | National, European |
| **Fellowship** | - | Istituzioni culturali | Piattaforme int'l | European |
| **Competition** | Comuni | Istituzioni | Piattaforme | National, Regional |
| **Curatorial** | - | Biennale, Musei | Exibart RSS | National, European |

---

## 3. Frequenza di Importazione

### Giornaliera (Heartbeat)
- **1:00 AM UTC** - Importazione fonti Livello A (Istituzioni pubbliche)
- **1:30 AM UTC** - Importazione fonti Livello B (Fondazioni verificate)
- **2:00 AM UTC** - Importazione fonti Livello C (Piattaforme specializzate)
- **3:00 AM UTC** - Cleanup bandi scaduti
- **3:30 AM UTC** - Validazione autorevolezza e scoring

### Settimanale (Lunedì 4:00 AM UTC)
- Aggiornamento whitelist enti autorevolezza
- Analisi statistiche importazioni
- Verifica copertura geografica

---

## 4. Criteri di Validazione per Bandi Importati

### Validazione Obbligatoria
- ✅ Titolo non vuoto (max 255 caratteri)
- ✅ Deadline valida (non scaduta, anno 2024-2030)
- ✅ Entità/Fonte verificata
- ✅ URL esterno valido
- ✅ Categoria riconosciuta

### Validazione Consigliata
- ✅ Descrizione presente (min 50 caratteri)
- ✅ Budget minimo EUR 500
- ✅ Livello geografico coerente con fonte
- ✅ Nessun duplicato con bandi esistenti

### Esclusioni Automatiche
- ❌ Articoli di news/blog
- ❌ Bandi scaduti (deadline < oggi)
- ❌ Titoli generici o non pertinenti
- ❌ Fonti non autorevolte (score < 40/100)
- ❌ Bandi senza deadline definita

---

## 5. Scoring Autorevolezza

```
Score = (Fattore Fonte × 40) + (Fattore Categoria × 30) + (Fattore Completezza × 20) + (Fattore Recency × 10)

Fattore Fonte:
- Livello A: 100 punti
- Livello B: 80 punti
- Livello C: 60 punti

Fattore Categoria:
- Categoria verificata: 100 punti
- Categoria standard: 80 punti
- Categoria nuova: 60 punti

Fattore Completezza:
- Descrizione completa (>200 char): 100 punti
- Descrizione media (50-200 char): 70 punti
- Descrizione minima (<50 char): 40 punti

Fattore Recency:
- Pubblicato < 7 giorni: 100 punti
- Pubblicato < 30 giorni: 80 punti
- Pubblicato > 30 giorni: 60 punti
```

---

## 6. Gestione Errori e Retry

### Errori Transitori (Retry automatico)
- Timeout di rete (max 3 retry, backoff esponenziale)
- Rate limiting API (attesa 60s, max 3 retry)
- Database temporarily unavailable (attesa 30s, max 3 retry)

### Errori Permanenti (Logging e alert)
- Fonte non raggiungibile (skip, log, alert admin)
- Formato dati non valido (skip, log)
- Entità non autorevolte (skip, log)
- Quota API esaurita (alert admin)

---

## 7. Monitoraggio e Logging

### Metriche Tracciate
- Numero bandi importati per fonte
- Numero bandi scartati (motivo)
- Score autorevolezza medio
- Copertura geografica
- Tempo di esecuzione job

### Log Locations
- `/home/ubuntu/collettivo-biscaya/.manus-logs/devserver.log` - Log dev
- Database `import_logs` table - Log persistente

---

## 8. Implementazione Heartbeat Jobs

### Job 1: Multi-Source Import (Livello A)
```
Name: multi-source-import-level-a
Cron: 0 1 * * * (1:00 AM UTC)
Path: /api/scheduled/multi-source-import
Payload: { level: "A" }
```

### Job 2: Multi-Source Import (Livello B)
```
Name: multi-source-import-level-b
Cron: 0 1 30 * * * (1:30 AM UTC)
Path: /api/scheduled/multi-source-import
Payload: { level: "B" }
```

### Job 3: Multi-Source Import (Livello C)
```
Name: multi-source-import-level-c
Cron: 0 2 * * * (2:00 AM UTC)
Path: /api/scheduled/multi-source-import
Payload: { level: "C" }
```

### Job 4: Cleanup Expired Calls
```
Name: cleanup-expired-calls
Cron: 0 3 * * * (3:00 AM UTC)
Path: /api/scheduled/cleanup-expired-calls
Payload: {}
```

### Job 5: Authority Validation
```
Name: authority-validation
Cron: 0 3 30 * * * (3:30 AM UTC)
Path: /api/scheduled/authority-validation
Payload: {}
```

---

## 9. Prossimi Step

1. ✅ Analisi criteri di autorevolezza (COMPLETATO)
2. ⏳ Implementare heartbeat jobs per importazione per livello
3. ⏳ Estendere CallValidator con scoring autorevolezza
4. ⏳ Configurare cron jobs nel sistema
5. ⏳ Testing e verifica flusso automatico
6. ⏳ Documentazione e deployment
