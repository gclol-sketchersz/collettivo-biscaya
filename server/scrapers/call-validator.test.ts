import { describe, it, expect } from 'vitest';
import { CallValidator } from './call-validator';

describe('CallValidator', () => {
  describe('isValidCall', () => {
    it('should accept valid calls with call keywords', () => {
      const title = 'Bando per residenza artistica';
      const description = 'Cerchiamo artisti per una residenza di 3 mesi in Italia';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(true);
    });

    it('should reject articles without call keywords', () => {
      const title = 'I Kabakov arrivano a Venezia';
      const description = 'Un racconto intimo della loro vita artistica';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(false);
    });

    it('should reject news articles', () => {
      const title = 'Sotheby\'s: un seguace di Bosch venduto';
      const description = 'L\'opera è stata venduta per oltre 10 volte la stima iniziale';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(false);
    });

    it('should reject content with exclude keywords', () => {
      const title = 'Rassegna stampa arte contemporanea';
      const description = 'Notizie dal mondo dell\'arte';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(false);
    });

    it('should accept calls with call keywords even if they have exclude keywords', () => {
      const title = 'Bando per mostra - Open Call';
      const description = 'Cerchiamo artisti per una mostra internazionale. Scadenza 30 giugno';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(true);
    });

    it('should reject calls with very short descriptions', () => {
      const title = 'Bando';
      const description = 'Scadenza 30 giugno';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(false);
    });

    it('should accept fellowship calls', () => {
      const title = '2026 Visiting Artist Fellowship';
      const description = 'We are seeking talented artists for a 6-month fellowship program in New York. Deadline: December 31, 2025';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(true);
    });

    it('should accept grant calls', () => {
      const title = 'Creative Europe Grant';
      const description = 'European Commission is offering grants for cultural projects. Apply now with your project proposal. Deadline: March 15, 2026';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(true);
    });

    it('should accept competition calls', () => {
      const title = 'Concorso Fotografico Nazionale';
      const description = 'Partecipa al nostro concorso fotografico annuale. Tema: paesaggi urbani. Scadenza: 31 agosto 2026';
      expect(CallValidator.isValidCall(title, description, 'test')).toBe(true);
    });
  });

  describe('extractCallType', () => {
    it('should extract residency type', () => {
      const title = 'Residenza Artistica';
      const description = 'Residency program for artists';
      expect(CallValidator.extractCallType(title, description)).toBe('residency');
    });

    it('should extract fellowship type', () => {
      const title = 'Fellowship Program';
      const description = 'Borsa di studio per artisti';
      expect(CallValidator.extractCallType(title, description)).toBe('fellowship');
    });

    it('should extract competition type', () => {
      const title = 'Concorso Artistico';
      const description = 'Competition for emerging artists';
      expect(CallValidator.extractCallType(title, description)).toBe('competition');
    });

    it('should extract award type', () => {
      const title = 'Premio Nazionale';
      const description = 'Award for artistic excellence';
      expect(CallValidator.extractCallType(title, description)).toBe('award');
    });

    it('should extract grant type', () => {
      const title = 'Finanziamento Progetti';
      const description = 'Grant for cultural projects';
      expect(CallValidator.extractCallType(title, description)).toBe('grant');
    });

    it('should extract curatorial open call type', () => {
      const title = 'Open Call Curatoriale';
      const description = 'Curatela di una mostra internazionale';
      expect(CallValidator.extractCallType(title, description)).toBe('curatorial_open_call');
    });

    it('should extract exhibition type', () => {
      const title = 'Exhibition Call';
      const description = 'Mostra internazionale di arte contemporanea';
      expect(CallValidator.extractCallType(title, description)).toBe('exhibition');
    });

    it('should return null for unknown types', () => {
      const title = 'Something else';
      const description = 'Random content';
      expect(CallValidator.extractCallType(title, description)).toBe(null);
    });
  });

  describe('cleanTitle', () => {
    it('should clean title with extra spaces', () => {
      const title = '  Bando   per   residenza  ';
      expect(CallValidator.cleanTitle(title)).toBe('Bando per residenza');
    });

    it('should remove leading punctuation', () => {
      const title = '---Bando per residenza---';
      expect(CallValidator.cleanTitle(title)).toBe('Bando per residenza');
    });

    it('should limit title length', () => {
      const title = 'A'.repeat(300);
      const cleaned = CallValidator.cleanTitle(title);
      expect(cleaned.length).toBeLessThanOrEqual(255);
    });
  });

  describe('cleanDescription', () => {
    it('should clean description with extra spaces', () => {
      const desc = '  Descrizione   con   spazi  ';
      expect(CallValidator.cleanDescription(desc)).toBe('Descrizione con spazi');
    });

    it('should limit description length', () => {
      const desc = 'A'.repeat(6000);
      const cleaned = CallValidator.cleanDescription(desc);
      expect(cleaned.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('isValidDeadline', () => {
    it('should accept deadline in the future', () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      expect(CallValidator.isValidDeadline(future)).toBe(true);
    });

    it('should accept deadline in the recent past (within 6 months)', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 30);
      expect(CallValidator.isValidDeadline(recent)).toBe(true);
    });

    it('should reject deadline too far in the past', () => {
      const old = new Date();
      old.setDate(old.getDate() - 200);
      expect(CallValidator.isValidDeadline(old)).toBe(false);
    });

    it('should reject deadline too far in the future', () => {
      const far = new Date();
      far.setDate(far.getDate() + 400);
      expect(CallValidator.isValidDeadline(far)).toBe(false);
    });

    it('should accept deadline today', () => {
      const today = new Date();
      expect(CallValidator.isValidDeadline(today)).toBe(true);
    });
  });
});
