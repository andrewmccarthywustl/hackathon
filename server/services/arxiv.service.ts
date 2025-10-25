import axios from 'axios';
import { ArxivPaper } from '../types';

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

export class ArxivService {
  /**
   * Search arXiv papers by query string
   */
  async searchPapers(query: string, maxResults: number = 10): Promise<ArxivPaper[]> {
    try {
      const response = await axios.get(ARXIV_API_URL, {
        params: {
          search_query: `all:${query}`,
          start: 0,
          max_results: maxResults,
          sortBy: 'relevance',
          sortOrder: 'descending'
        }
      });

      return this.parseArxivResponse(response.data);
    } catch (error) {
      console.error('Error fetching arXiv papers:', error);
      throw new Error('Failed to fetch papers from arXiv');
    }
  }

  /**
   * Search papers by specific categories
   */
  async searchByCategory(category: string, maxResults: number = 10): Promise<ArxivPaper[]> {
    try {
      const response = await axios.get(ARXIV_API_URL, {
        params: {
          search_query: `cat:${category}`,
          start: 0,
          max_results: maxResults,
          sortBy: 'lastUpdatedDate',
          sortOrder: 'descending'
        }
      });

      return this.parseArxivResponse(response.data);
    } catch (error) {
      console.error('Error fetching arXiv papers by category:', error);
      throw new Error('Failed to fetch papers from arXiv');
    }
  }

  /**
   * Search for researchers working on similar topics
   */
  async findRelatedResearchers(topic: string): Promise<{ authors: string[], papers: ArxivPaper[] }> {
    const papers = await this.searchPapers(topic, 20);
    const authorsSet = new Set<string>();

    papers.forEach(paper => {
      paper.authors.forEach(author => authorsSet.add(author));
    });

    return {
      authors: Array.from(authorsSet),
      papers
    };
  }

  /**
   * Parse arXiv XML response to JSON
   */
  private parseArxivResponse(xmlData: string): ArxivPaper[] {
    const papers: ArxivPaper[] = [];

    // Simple XML parsing for arXiv feed
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = xmlData.match(entryRegex) || [];

    entries.forEach(entry => {
      const getId = (tag: string): string => {
        const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`));
        return match ? match[1].trim() : '';
      };

      const getAuthors = (): string[] => {
        const authorRegex = /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g;
        const authors: string[] = [];
        let match;
        while ((match = authorRegex.exec(entry)) !== null) {
          authors.push(match[1].trim());
        }
        return authors;
      };

      const getCategories = (): string[] => {
        const categoryRegex = /<category[^>]+term="([^"]+)"/g;
        const categories: string[] = [];
        let match;
        while ((match = categoryRegex.exec(entry)) !== null) {
          categories.push(match[1]);
        }
        return categories;
      };

      const getPdfLink = (): string => {
        const linkRegex = /<link[^>]+title="pdf"[^>]+href="([^"]+)"/;
        const match = entry.match(linkRegex);
        return match ? match[1] : '';
      };

      const id = getId('id').replace('http://arxiv.org/abs/', '');

      papers.push({
        id,
        title: getId('title').replace(/\n/g, ' ').replace(/\s+/g, ' '),
        authors: getAuthors(),
        summary: getId('summary').replace(/\n/g, ' ').replace(/\s+/g, ' '),
        published: getId('published'),
        updated: getId('updated'),
        categories: getCategories(),
        pdfLink: getPdfLink()
      });
    });

    return papers;
  }
}
