import { drizzle } from "drizzle-orm/mysql2";
import { callsForEntries } from "./drizzle/schema";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL || "");

const calls = [
  {
    title: "Casasanvito Open Call 2026 - Residenze d'artista",
    entity: "Casasanvito",
    country: "Italia (Marche)",
    geographicLevel: "regional",
    callType: "residency",
    deadline: new Date("2026-01-31"),
    requirements: "Aperta a tutte le discipline artistiche, nessuna limitazione di linguaggio o medium.",
    benefits: "Ospitalità in dimora settecentesca, atelier, aree comuni, camere private. Periodo di ricerca intensivo (29 ago - 13 set 2026).",
    externalLink: "https://www.exibart.com/bandi-e-concorsi/casasanvito-le-open-call-2026-per-residenze-dartista-nelle-marche/",
    costs: "Non specificati (ospitalità inclusa)",
    qualitativeNotes: "Focus su ricerca, confronto e sperimentazione in contesto rurale e storico.",
    accessibility: "Dimora storica - verificare accessibilità motoria specifica",
    isActive: 1,
  },
  {
    title: "MYllennium Award 2026",
    entity: "Fondazione Barletta",
    country: "Italia",
    geographicLevel: "national",
    callType: "award",
    deadline: new Date("2026-05-04"),
    requirements: "Giovani di età compresa tra i 18 e i 30 anni. Sezioni: Arte, Cinema, Musica, Scrittura, Giornalismo, Imprenditoria, Formazione, Sport.",
    benefits: "Premi in denaro, opportunità di formazione, visibilità nazionale, percorsi di accelerazione.",
    externalLink: "https://myllenniumaward.org/",
    costs: "Partecipazione gratuita",
    qualitativeNotes: "Uno dei principali premi multidisciplinari per under 30 in Italia. 11 edizioni, 5500+ partecipanti, 359 premiati.",
    accessibility: "Sito web accessibile, partecipazione digitale",
    isActive: 1,
  },
  {
    title: "Étant donnés Program 2026",
    entity: "Villa Albertine & Albertine Foundation",
    country: "Francia / USA",
    geographicLevel: "european",
    callType: "grant",
    deadline: new Date("2026-02-14"),
    requirements: "Artisti francesi o residenti in Francia per progetti negli USA; curatori americani per ricerca in Francia.",
    benefits: "Finanziamento per mostre, produzioni, nuove commissioni e ricerca curatoriale. Supporto istituzionale completo.",
    externalLink: "https://villa-albertine.org/va/professionals/call-for-applications-the-2026-etant-donnes-program/",
    costs: "Partecipazione gratuita",
    qualitativeNotes: "Programma prestigioso per la collaborazione internazionale tra Francia e Stati Uniti nelle arti visive. 30 anni di storia, 700+ artisti supportati.",
    accessibility: "Supporto istituzionale internazionale",
    isActive: 1,
  },
  {
    title: "Kranj Foto Fest Open Call for Exhibitions 2026",
    entity: "Kranj Foto Fest",
    country: "Slovenia",
    geographicLevel: "european",
    callType: "exhibition",
    deadline: new Date("2026-02-23"),
    requirements: "Fotografi e artisti visivi con progetti fotografici contemporanei.",
    benefits: "Esposizione durante il festival, visibilità internazionale, catalogo pubblicato.",
    externalLink: "https://on-the-move.org/news/kranj-foto-fest-open-call-exhibitions-2026-slovenia",
    costs: "Fee di partecipazione (verificare sul sito ufficiale)",
    qualitativeNotes: "Focus sulla fotografia contemporanea. Festival riconosciuto a livello europeo.",
    accessibility: "Spazi espositivi pubblici e accessibili",
    isActive: 1,
  },
  {
    title: "AIR InSILo - 2026 Residency on Place",
    entity: "AIR InSILo",
    country: "Austria",
    geographicLevel: "european",
    callType: "residency",
    deadline: new Date("2026-02-23"),
    requirements: "Artisti multidisciplinari interessati al concetto di 'luogo' e territorio.",
    benefits: "Alloggio, spazio di lavoro, borsa di studio/rimborso spese, accesso alla comunità artistica locale.",
    externalLink: "https://on-the-move.org/news/2026-residency-place-austria",
    costs: "Partecipazione gratuita",
    qualitativeNotes: "Residenza in contesto rurale/naturale con focus sulla relazione tra artista e territorio.",
    accessibility: "Verificare specifiche per disabilità motorie",
    isActive: 1,
  },
  {
    title: "Solo Dance Contest - Gdańsk Dance Festival 2026",
    entity: "Klub Żak",
    country: "Polonia",
    geographicLevel: "european",
    callType: "competition",
    deadline: new Date("2026-03-22"),
    requirements: "Danzatori solisti di qualsiasi nazionalità e stile di danza contemporanea.",
    benefits: "Premi in denaro, opportunità di esibizione durante il festival, visibilità internazionale.",
    externalLink: "https://on-the-move.org/news/solo-dance-contest-gdansk-dance-festival-2026-poland",
    costs: "Fee di iscrizione (verificare importo)",
    qualitativeNotes: "Uno dei principali contest per la danza contemporanea in Europa centrale.",
    accessibility: "Teatri e spazi performativi professionali",
    isActive: 1,
  },
  {
    title: "Bando per la valorizzazione di Beni storico-artistici e culturali",
    entity: "Fondazione con il Sud",
    country: "Italia (Sud Italia)",
    geographicLevel: "national",
    callType: "grant",
    deadline: new Date("2026-03-18"),
    requirements: "Organizzazioni non profit in partnership. Progetti di valorizzazione di beni immobili pubblici.",
    benefits: "Finanziamenti per la valorizzazione di beni immobili pubblici inutilizzati. Grande impatto sociale e culturale.",
    externalLink: "https://www.fondazioneconilsud.it/news/bando-per-la-valorizzazione-di-beni-storico-artistici-e-culturali/",
    costs: "Nessuno per la candidatura",
    qualitativeNotes: "Grande impatto sociale e culturale nel Mezzogiorno. Progetti di rigenerazione urbana.",
    accessibility: "Progetti focalizzati sull'accessibilità dei beni",
    isActive: 1,
  },
  {
    title: "Magic Carpets - Residency in Contemporary Dance on Inclusive Movement",
    entity: "Magic Carpets / New Theatre Institute of Latvia",
    country: "Lettonia",
    geographicLevel: "european",
    callType: "residency",
    deadline: new Date("2026-02-06"),
    requirements: "Danzatori e coreografi interessati all'accessibilità e movimento inclusivo.",
    benefits: "Viaggio, alloggio, fee artistica, accesso a workshop e mentorship.",
    externalLink: "https://on-the-move.org/news/residency-contemporary-dance-inclusive-movement-and-accessibility-latvia",
    costs: "Gratuito",
    qualitativeNotes: "Focus specifico su movimento inclusivo e accessibilità. Progetto innovativo.",
    accessibility: "Progetto dedicato all'accessibilità",
    isActive: 1,
  },
  {
    title: "Orizzonti L.I.V.E. 2026 - Fondazione CRT",
    entity: "Fondazione CRT",
    country: "Italia (Piemonte e Valle d'Aosta)",
    geographicLevel: "regional",
    callType: "grant",
    deadline: new Date("2026-03-05"),
    requirements: "Compagnie e associazioni culturali locali con progetti di spettacolo dal vivo.",
    benefits: "Sostegno alla produzione e programmazione di spettacoli dal vivo. Supporto fondamentale per il territorio.",
    externalLink: "https://www.fondazionecrt.it/",
    costs: "Nessuno",
    qualitativeNotes: "Supporto fondamentale per il territorio del Nord-Ovest. Fondazione storica.",
    accessibility: "Teatri e spazi regionali",
    isActive: 1,
  },
  {
    title: "Residenze d'artista Regione Toscana 2026",
    entity: "Regione Toscana",
    country: "Italia (Toscana)",
    geographicLevel: "regional",
    callType: "residency",
    deadline: new Date("2026-02-28"),
    requirements: "Giovani artisti e curatori under 35. Tutte le discipline artistiche.",
    benefits: "Residenza di 6-9 mesi in Toscana. Alloggio, spazio di lavoro, borsa di studio. Coinvolgimento di 168 giovani artisti.",
    externalLink: "https://www.regione.toscana.it/-/-residenze-d-artista-dalla-regione-4-milioni-per-12-progetti",
    costs: "Nessuno",
    qualitativeNotes: "Progetto regionale ambizioso con 4 milioni di euro di finanziamento. 12 progetti di residenza.",
    accessibility: "Spazi pubblici e accessibili in Toscana",
    isActive: 1,
  },
];

async function seed() {
  try {
    console.log("Seeding database with 10 cultural calls...");
    
    for (const call of calls) {
      await db.insert(callsForEntries).values(call);
      console.log(`✓ Inserted: ${call.title}`);
    }
    
    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
