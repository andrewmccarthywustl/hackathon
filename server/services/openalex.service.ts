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
  ids?: {
    openalex?: string;
    orcid?: string;
    scopus?: string;
    twitter?: string;
    wikipedia?: string;
    mag?: string;
  };
  homepage_url?: string;
  works_api_url?: string;
  updated_date?: string;
}

export interface ResearcherContact {
  name: string;
  institution?: string;
  email?: string;
  orcid?: string;
  googleScholar?: string;
  homepage?: string;
  twitter?: string;
  wikipedia?: string;
  openAlexProfile?: string;
  scopusProfile?: string;
  citations?: number;
  publications?: number;
  researchAreas?: string[];
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

  // Map common institution abbreviations to full names
  private institutionMap: Record<string, string[]> = {
    'washu': ['Washington University in St. Louis', 'Washington University', 'WUSTL'],
    'mit': ['Massachusetts Institute of Technology', 'MIT'],
    'stanford': ['Stanford University', 'Stanford'],
    'harvard': ['Harvard University', 'Harvard'],
    'yale': ['Yale University', 'Yale'],
    'princeton': ['Princeton University', 'Princeton'],
    'columbia': ['Columbia University', 'Columbia'],
    'upenn': ['University of Pennsylvania', 'Penn'],
    'cornell': ['Cornell University', 'Cornell'],
    'uchicago': ['University of Chicago', 'UChicago'],
    'berkeley': ['University of California, Berkeley', 'UC Berkeley', 'Berkeley'],
    'ucla': ['University of California, Los Angeles', 'UCLA'],
    'ucsd': ['University of California, San Diego', 'UC San Diego', 'UCSD'],
  };

  private normalizeInstitution(institution: string): string[] {
    const lower = institution.toLowerCase().trim();

    // Check if it's a known abbreviation
    for (const [abbrev, fullNames] of Object.entries(this.institutionMap)) {
      if (lower.includes(abbrev)) {
        return fullNames;
      }
    }

    // Return the original institution name
    return [institution];
  }

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
   * Search for institution ID by name (Step 1 of 2-step process)
   */
  async findInstitutionId(institutionName: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/institutions`, {
        params: {
          search: institutionName,
          per_page: 5,
          mailto: this.mailto
        }
      });

      const results = response.data.results || [];
      if (results.length > 0) {
        console.log(`[OpenAlex] Found institution: ${results[0].display_name} (${results[0].id})`);
        return results[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error finding institution ID:', error);
      return null;
    }
  }

  /**
   * Search for authors at a specific institution (Step 2 of 2-step process)
   */
  async searchAuthorsByInstitution(institutionName: string, limit: number = 20, topic?: string): Promise<OpenAlexAuthor[]> {
    try {
      // Normalize institution name
      const possibleNames = this.normalizeInstitution(institutionName);

      console.log(`[OpenAlex] Searching for authors at institution: ${institutionName}`);
      console.log(`[OpenAlex] Possible institution names:`, possibleNames);

      // Step 1: Find institution ID
      let institutionId: string | null = null;
      for (const name of possibleNames) {
        institutionId = await this.findInstitutionId(name);
        if (institutionId) break;
      }

      if (!institutionId) {
        console.log(`[OpenAlex] Could not find institution ID for: ${institutionName}`);
        return [];
      }

      // Step 2: Search authors by institution ID
      const filters = [`last_known_institutions.id:${institutionId}`];

      // Add topic filter if provided
      if (topic) {
        filters.push(`display_name.search:${topic}`);
        console.log(`[OpenAlex] Searching with topic filter: ${topic}`);
      }

      console.log(`[OpenAlex] Filter: ${filters.join(',')}`);

      const response = await axios.get(`${this.baseUrl}/authors`, {
        params: {
          filter: filters.join(','),
          per_page: Math.min(limit, 50),
          sort: 'cited_by_count:desc',
          mailto: this.mailto
        }
      });

      const results = response.data.results || [];
      console.log(`[OpenAlex] Found ${results.length} authors`);

      return results.slice(0, limit);
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
      // Normalize institution name
      const possibleNames = this.normalizeInstitution(institutionName);

      for (const name of possibleNames) {
        const response = await axios.get(`${this.baseUrl}/works`, {
          params: {
            filter: `authorships.institutions.display_name.search:${name}`,
            per_page: limit,
            sort: 'cited_by_count:desc',
            mailto: this.mailto
          }
        });

        const results = response.data.results || [];
        if (results.length > 0) {
          return results;
        }
      }

      return [];
    } catch (error) {
      console.error('Error searching OpenAlex works by institution:', error);
      return [];
    }
  }

  /**
   * Extract comprehensive contact information from OpenAlex author
   */
  extractContactInfo(author: OpenAlexAuthor): ResearcherContact {
    const contact: ResearcherContact = {
      name: author.display_name,
      institution: author.last_known_institution?.display_name,
      citations: author.cited_by_count,
      publications: author.works_count,
      researchAreas: author.x_concepts?.slice(0, 5).map(c => c.display_name) || []
    };

    // ORCID
    if (author.orcid) {
      contact.orcid = author.orcid;
    } else if (author.ids?.orcid) {
      contact.orcid = author.ids.orcid;
    }

    // OpenAlex profile
    if (author.id) {
      contact.openAlexProfile = author.id;
    }

    // Scopus
    if (author.ids?.scopus) {
      contact.scopusProfile = `https://www.scopus.com/authid/detail.uri?authorId=${author.ids.scopus}`;
    }

    // Twitter
    if (author.ids?.twitter) {
      contact.twitter = `https://twitter.com/${author.ids.twitter}`;
    }

    // Wikipedia
    if (author.ids?.wikipedia) {
      contact.wikipedia = author.ids.wikipedia;
    }

    // Homepage
    if (author.homepage_url) {
      contact.homepage = author.homepage_url;
    }

    // Generate Google Scholar search URL (not perfect, but gives a starting point)
    const scholarSearchName = encodeURIComponent(author.display_name);
    contact.googleScholar = `https://scholar.google.com/scholar?q=author:"${scholarSearchName}"`;

    return contact;
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
