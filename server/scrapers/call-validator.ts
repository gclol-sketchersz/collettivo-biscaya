/**
 * Call Validator
 * Validates scraped calls to ensure they are actual tenders/calls
 * and not articles, news, or other non-relevant content
 */

export class CallValidator {
  /**
   * Keywords that indicate a call/tender/opportunity
   */
  private static readonly CALL_KEYWORDS = [
    'bando', 'avviso', 'call', 'concorso', 'premio', 'residenza',
    'fellowship', 'grant', 'finanziamento', 'contributo', 'borsa',
    'opportunità', 'candidature', 'candidati', 'selezione', 'ammissione',
    'partecipazione', 'iscrizione', 'adesione', 'domanda', 'richiesta',
    'scadenza', 'deadline', 'termine', 'entro il', 'fino al',
    'open call', 'open application', 'call for', 'call for artists',
    'artist residency', 'artistic residency', 'residency program',
    'award', 'prize', 'competition', 'exhibition', 'curatorial'
  ];

  /**
   * Keywords that indicate non-relevant content (articles, news, etc.)
   * These are strong signals to reject UNLESS there are clear call keywords
   */
  private static readonly EXCLUDE_KEYWORDS = [
    'sotheby', 'christie', 'auction', 'asta', 'vendita', 'sold', 'venduto',
    'prezzo', 'price', 'stima', 'estimate', 'lotto', 'lot'
  ];

  /**
   * Validate if a scraped call is a legitimate tender/call
   * TEMPORARILY DISABLED - accepting all calls for import
   */
  static isValidCall(title: string, description: string, source: string): boolean {
    // Temporarily disabled - accept all calls
    // The cleanup-expired-calls endpoint will remove invalid/expired calls
    return true;
  }

  /**
   * Extract keywords from text to help categorize calls
   */
  static extractCallType(title: string, description: string): string | null {
    const fullText = `${title} ${description}`.toLowerCase();

    // Check for specific call types
    if (fullText.includes('residenza') || fullText.includes('residency')) {
      return 'residency';
    }
    if (fullText.includes('fellowship') || fullText.includes('borsa')) {
      return 'fellowship';
    }
    if (fullText.includes('concorso') || fullText.includes('competition')) {
      return 'competition';
    }
    if (fullText.includes('premio') || fullText.includes('award') || fullText.includes('prize')) {
      return 'award';
    }
    if (fullText.includes('finanziamento') || fullText.includes('grant') || fullText.includes('contributo')) {
      return 'grant';
    }
    if (fullText.includes('open call') || fullText.includes('curatorial') || fullText.includes('curatela')) {
      return 'curatorial_open_call';
    }
    if (fullText.includes('mostra') || fullText.includes('exhibition')) {
      return 'exhibition';
    }

    return null;
  }

  /**
   * Clean and normalize call title
   */
  static cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^[\s\-:]+|[\s\-:]+$/g, '') // Remove leading/trailing spaces and punctuation
      .trim()
      .substring(0, 255); // Limit to 255 chars
  }

  /**
   * Clean and normalize description
   */
  static cleanDescription(description: string): string {
    return description
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^[\s\-:]+|[\s\-:]+$/g, '') // Remove leading/trailing spaces and punctuation
      .trim()
      .substring(0, 5000); // Limit to 5000 chars
  }

  /**
   * Validate deadline is reasonable (not too far in past or future)
   */
  static isValidDeadline(deadline: Date): boolean {
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Deadline should not be more than 6 months in the past
    if (deadline < sixMonthsAgo) {
      return false;
    }

    // Deadline should not be more than 1 year in the future
    if (deadline > oneYearFromNow) {
      return false;
    }

    return true;
  }
}
