import axios from 'axios';

interface SemanticScholarAuthor {
  authorId: string;
  name: string;
  affiliations?: string[];
  homepage?: string;
  paperCount?: number;
  citationCount?: number;
  hIndex?: number;
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  authors: { authorId: string; name: string }[];
  citationCount?: number;
  url?: string;
}

export class SemanticScholarService {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  /**
   * Search for authors by name or affiliation
   */
  async searchAuthors(query: string, limit: number = 10): Promise<SemanticScholarAuthor[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/author/search`, {
        params: {
          query,
          limit,
          fields: 'name,affiliations,homepage,paperCount,citationCount,hIndex'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error searching Semantic Scholar authors:', error);
      return [];
    }
  }

  /**
   * Search for papers
   */
  async searchPapers(query: string, limit: number = 10): Promise<SemanticScholarPaper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/paper/search`, {
        params: {
          query,
          limit,
          fields: 'title,abstract,year,authors,citationCount,url'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error searching Semantic Scholar papers:', error);
      return [];
    }
  }

  /**
   * Get author details by ID
   */
  async getAuthor(authorId: string): Promise<SemanticScholarAuthor | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/author/${authorId}`, {
        params: {
          fields: 'name,affiliations,homepage,paperCount,citationCount,hIndex'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Semantic Scholar author:', error);
      return null;
    }
  }
}
