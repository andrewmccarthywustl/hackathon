import axios from 'axios';

interface OpenAlexAuthor {
  id: string;
  display_name: string;
  orcid?: string;
  works_count?: number;
  cited_by_count?: number;
  last_known_institution?: {
    display_name: string;
    ror?: string;
    country_code?: string;
  };
  x_concepts?: Array<{
    display_name: string;
    score: number;
  }>;
}

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year?: number;
  type?: string;
  authorships: Array<{
    author: {
      id: string;
      display_name: string;
    };
    institutions: Array<{
      display_name: string;
    }>;
  }>;
  cited_by_count?: number;
  abstract_inverted_index?: Record<string, number[]>;
}

export class OpenAlexService {
  private baseUrl = 'https://api.openalex.org';
  private mailto = 'researcher-chat@example.com'; // Polite pool - faster response

  /**
   * Search for authors by name or institution
   */
  async searchAuthors(query: string, limit: number = 10): Promise<OpenAlexAuthor[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/authors`, {
        params: {
          search: query,
          per_page: limit,
          mailto: this.mailto
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error searching OpenAlex authors:', error);
      return [];
    }
  }

  /**
   * Search for authors at a specific institution
   */
  async searchAuthorsByInstitution(institutionName: string, limit: number = 20): Promise<OpenAlexAuthor[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/authors`, {
        params: {
          filter: `last_known_institution.display_name.search:${institutionName}`,
          per_page: limit,
          sort: 'cited_by_count:desc',
          mailto: this.mailto
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error searching OpenAlex authors by institution:', error);
      return [];
    }
  }

  /**
   * Search for works (papers)
   */
  async searchWorks(query: string, limit: number = 10): Promise<OpenAlexWork[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/works`, {
        params: {
          search: query,
          per_page: limit,
          mailto: this.mailto
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error searching OpenAlex works:', error);
      return [];
    }
  }

  /**
   * Search for works at a specific institution
   */
  async searchWorksByInstitution(institutionName: string, limit: number = 10): Promise<OpenAlexWork[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/works`, {
        params: {
          filter: `institutions.display_name.search:${institutionName}`,
          per_page: limit,
          sort: 'cited_by_count:desc',
          mailto: this.mailto
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error searching OpenAlex works by institution:', error);
      return [];
    }
  }

  /**
   * Reconstruct abstract from inverted index
   */
  reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    const words: Array<{ word: string; position: number }> = [];

    for (const [word, positions] of Object.entries(invertedIndex)) {
      positions.forEach(pos => {
        words.push({ word, position: pos });
      });
    }

    words.sort((a, b) => a.position - b.position);
    return words.map(w => w.word).join(' ').slice(0, 300);
  }
}
