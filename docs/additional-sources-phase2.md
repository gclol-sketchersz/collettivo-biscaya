# Fonti Aggiuntive per Copertura Completa - Fase 2

## Competition (Concorsi Artistici)

### Fonti Identificate:
1. **GAi - Giovani Artisti Italiani** (https://www.giovaniartisti.it/concorsi)
   - Moon Festival 2026
   - Concorsi per artisti emergenti
   - Call per site-specific e laboratori

2. **Torino Giovani** (https://www.torinogiovani.it/vivere-a-torino/cosa-fare-a-torino/cultura/concorsi-artistici-vari)
   - Concorsi artistici vari (letterari, fotografici)
   - Concorsi per artisti emergenti

3. **ABABO Academy** (https://www.ababo.it/objects/bandi-e-concorsi-esterni)
   - BOoks 2026
   - Realizzazione opera d'arte per il Demanio regionale Veneto
   - Levante Prize 2026
   - Il Ventaglio del Presidente 2026

4. **Portale Giovani Prato** (https://portalegiovani.prato.it/concorsiartistici)
   - Concorsi internazionali (es. Premio Trio di Trieste)
   - Concorsi musicali

5. **Mostra-mi** (https://www.mostra-mi.it/news/bandi-giovani-artisti/)
   - Bandi per artisti emergenti primavera 2026
   - Concorsi di illustrazione, design sostenibile, street art

## Award (Premi e Riconoscimenti)

### Fonti Identificate:
1. **Fondazione Sozzani** (https://fondazionesozzani.org/it/sozzani-award-ita/)
   - Sozzani Award
   - Premia eccellenza, ricerca e innovazione creativa
   - Borse di studio e fondi di supporto

2. **Fondazione Italia** (http://fondazioneitalia.org/)
   - Premio Italia nel Mondo (Italy in the World Award)
   - Riconoscimento alle Arti e Scienza Italiana

3. **Istituto Italiano di Cultura** (https://iicnewyork.esteri.it/it/gli_eventi/archivio-eventi/)
   - Premi e concorsi internazionali
   - Opportunità per artisti italiani all'estero

## Fellowship (Borse di Studio)

### Fonti Identificate:
1. **UrbanGlass** (https://urbanglass.org/studio/detail/visiting-artist-and-designer-fellowship)
   - 2026 Visiting Artist and Designer Fellowship
   - Supporto per sviluppo opere in vetro

2. **AFH Boston** (https://www.afhboston.org/news/2026-fellowship)
   - 2026 AFH Artists Fellowship
   - Deadline: 8 maggio 2026
   - Stipendio: $9,600 + workshop professionali

3. **Unione Internazionale Istituti Archeologia** (Instagram)
   - Postdoctoral Fellowships
   - Deadline: 31 marzo 2026

## Bandi Europei

### Fonti Identificate:
1. **Creative Europe Programme** (https://culture.ec.europa.eu/funding/calls)
   - 2026 Creative Europe call for European cooperation projects
   - Budget: €60M
   - Deadline: 5 maggio 2026
   - ~150 progetti attesi

2. **Culture Moves Europe** (https://culture.ec.europa.eu/culture-moves-europe/home)
   - Grants per artisti e professionisti culturali
   - Budget: €25 milioni
   - Supporto per travel e progetti in altri paesi Creative Europe

3. **Horizon Europe - Cluster 2** (https://rea.ec.europa.eu/funding-and-grants/)
   - European Cultural Heritage and Cultural and Creative Industries
   - Info Day: 26 marzo 2026
   - Deadline: 23 settembre 2026

4. **EUNIC - Spaces of Culture 2026** (https://eunic.eu/news/spaces-of-culture-2026)
   - Call for proposals
   - Progetti contemporanei e innovativi in arti, creative industries, digitalizzazione
   - Scadenza: 30 marzo 2026

5. **Erasmus+ 2026** (https://erasmus-plus.ec.europa.eu/funding-calls)
   - Bandi per educazione, gioventù, cultura
   - Opportunità per organizzazioni e professionisti

6. **EU Funding Portal** (https://eufundingportal.eu/tag/culture/)
   - Aggregatore di bandi europei per cultura
   - Programmi di capacity-building per musei

## Strategie di Implementazione

### Per Competition:
- Web scraping da GAi, Torino Giovani, ABABO, Portale Giovani Prato
- Parser specifico per estrarre: titolo, deadline, budget, tipo concorso, regione

### Per Award:
- Web scraping da Fondazione Sozzani, Fondazione Italia, IIC
- Parser per estrarre: premio, deadline, criteri, importo premio

### Per Fellowship:
- Web scraping da UrbanGlass, AFH Boston, EUNIC
- Parser per estrarre: fellowship, deadline, stipendio, requisiti

### Per Bandi Europei:
- Integrazione con Creative Europe API
- Web scraping da EU Funding Portal
- Parser per estrarre: progetto, deadline, budget, paesi ammissibili
- Geographic level: european

## Prossimi Passi:
1. Implementare parser per competition (GAi, Torino Giovani, ABABO)
2. Implementare parser per award (Fondazione Sozzani)
3. Implementare parser per fellowship (UrbanGlass, AFH Boston)
4. Implementare parser per bandi europei (Creative Europe, EU Funding Portal)
5. Aggiornare multi-source import job con nuove categorie
6. Eseguire importazione completa e verificare copertura
