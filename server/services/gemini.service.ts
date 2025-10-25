import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, ArxivPaper } from '../types';
import { ArxivService } from './arxiv.service';
import { SemanticScholarService } from './semantic-scholar.service';
import { OpenAlexService } from './openalex.service';
import { Logger } from '../utils/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model;
  private arxivService: ArxivService;
  private semanticScholar: SemanticScholarService;
  private openAlex: OpenAlexService;
  private logger: Logger;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.arxivService = new ArxivService();
    this.semanticScholar = new SemanticScholarService();
    this.openAlex = new OpenAlexService();
    this.logger = new Logger('GeminiService');

    // Define function tools for the AI to use
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'searchPapers',
            description: 'Search for research papers across multiple sources (arXiv, Semantic Scholar). Use this when the user asks about papers, publications, or recent research on a topic.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query for papers (e.g., "quantum computing", "machine learning optimization")'
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of papers to return (default: 10)'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'findResearchersByTopic',
            description: 'Find researchers working on specific topics across multiple databases. Use when asked about researchers in a field.',
            parameters: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'The research topic or field'
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of researchers (default: 15)'
                }
              },
              required: ['topic']
            }
          },
          {
            name: 'findResearchersByInstitution',
            description: 'Find researchers at a specific university or institution. Use this when the user mentions ANY institution name like "WashU", "Washington University", "MIT", "Stanford", or asks about researchers "at" a specific place. Examples: "researchers at WashU", "biomedical researchers at Washington University", "MIT professors working on AI".',
            parameters: {
              type: 'object',
              properties: {
                institution: {
                  type: 'string',
                  description: 'Institution name (e.g., "Washington University", "WashU", "MIT", "Stanford")'
                },
                topic: {
                  type: 'string',
                  description: 'Optional: filter by research topic/field (e.g., "biomedical", "machine learning")'
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of researchers (default: 20)'
                }
              },
              required: ['institution']
            }
          },
          {
            name: 'analyzeResearchField',
            description: 'Analyze a research field to understand trends, themes, and opportunities.',
            parameters: {
              type: 'object',
              properties: {
                interests: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'List of research interests or topics to analyze'
                }
              },
              required: ['interests']
            }
          }
        ]
      }
    ];

    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools
    });
  }

  /**
   * Unified chat with automatic function calling
   */
  async chat(message: string, context?: ChatMessage[]): Promise<{
    response: string;
    papers?: ArxivPaper[];
    researchers?: string[];
  }> {
    const startTime = Date.now();
    this.logger.header(`NEW USER MESSAGE`);
    this.logger.info(`User query: "${message}"`);

    try {
      // Filter out assistant messages that aren't from actual responses (like welcome message)
      // and ensure history starts with a user message
      let chatHistory = context
        ?.filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }]
        })) || [];

      // Remove leading assistant/model messages - history must start with user
      while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
        chatHistory.shift();
      }

      this.logger.info(`Context history: ${chatHistory.length} messages`);

      const chat = this.model.startChat({
        history: chatHistory,
        systemInstruction: {
          role: 'system',
          parts: [{ text: `You are an expert AI assistant helping researchers explore their field, find collaborators, and discover relevant papers.

IMPORTANT: You MUST call the appropriate functions to answer user questions. Do NOT try to answer without calling functions.

When users ask about:
- Papers, publications, or research on a topic → CALL searchPapers
- Finding researchers by topic → CALL findResearchersByTopic
- Finding researchers AT a specific institution (like "at WashU", "at MIT", "at Stanford") → CALL findResearchersByInstitution
  - Look for keywords: "at", "from", institution names like "WashU", "Washington University", "MIT", "Stanford", etc.
  - Examples: "researchers at WashU", "biomedical researchers at Washington University", "MIT professors"
- Understanding a field, trends, or opportunities → CALL analyzeResearchField

You can call multiple functions if needed. Always provide helpful, accurate responses based on the function results.` }]
        }
      });

      this.logger.info('Sending message to Gemini...');
      let result = await chat.sendMessage(message);
      let response = result.response;

      // Debug logging
      this.logger.info(`Response object keys: ${Object.keys(response).join(', ')}`);
      this.logger.info(`Response has functionCalls: ${!!response.functionCalls}`);
      if (response.functionCalls) {
        this.logger.info(`Number of function calls: ${response.functionCalls.length}`);
        this.logger.info(`Function names: ${response.functionCalls.map(fc => fc.name).join(', ')}`);
      }

      // Try to get text even before function calls
      try {
        const initialText = response.text();
        if (initialText) {
          this.logger.warn(`Got text response BEFORE function calls: "${initialText.slice(0, 200)}..."`);
        }
      } catch (e) {
        this.logger.info('No initial text (this is normal if function calls are present)');
      }

      let collectedPapers: ArxivPaper[] = [];
      let collectedResearchers: string[] = [];
      let finalText = '';
      let functionCallCount = 0;

      // Handle function calls
      while (response.functionCalls && response.functionCalls.length > 0) {
        functionCallCount++;
        this.logger.separator();
        const functionCall = response.functionCalls[0];

        let functionResponse: any = {};

        if (functionCall.name === 'searchPapers') {
          const { query, maxResults = 10 } = functionCall.args as { query: string; maxResults?: number };
          this.logger.functionCall('searchPapers', { query, maxResults });

          // Search both arXiv and Semantic Scholar
          this.logger.apiCall('arXiv', `search?query=${query}&max=${maxResults}`);
          this.logger.apiCall('Semantic Scholar', `paper/search?query=${query}`);

          const apiStart = Date.now();
          const [arxivPapers, ssPapers] = await Promise.all([
            this.arxivService.searchPapers(query, maxResults),
            this.semanticScholar.searchPapers(query, Math.min(maxResults, 5))
          ]);
          const apiTime = Date.now() - apiStart;

          this.logger.result(`arXiv: ${arxivPapers.length} papers`, arxivPapers.length);
          this.logger.result(`Semantic Scholar: ${ssPapers.length} papers`, ssPapers.length);
          this.logger.success(`API calls completed in ${apiTime}ms`);

          collectedPapers.push(...arxivPapers);

          functionResponse = {
            arxivPapers: arxivPapers.map(p => ({
              title: p.title,
              authors: p.authors.slice(0, 3),
              year: p.published.split('-')[0]
            })),
            semanticScholarPapers: ssPapers.map(p => ({
              title: p.title,
              authors: p.authors.slice(0, 3).map(a => a.name),
              year: p.year,
              citations: p.citationCount
            }))
          };
        }
        else if (functionCall.name === 'findResearchersByTopic') {
          const { topic, maxResults = 15 } = functionCall.args as { topic: string; maxResults?: number };
          this.logger.functionCall('findResearchersByTopic', { topic, maxResults });

          // Search multiple sources
          this.logger.apiCall('arXiv', `findRelatedResearchers?topic=${topic}`);
          this.logger.apiCall('Semantic Scholar', `author/search?query=${topic}`);

          const apiStart = Date.now();
          const [arxivData, ssAuthors] = await Promise.all([
            this.arxivService.findRelatedResearchers(topic),
            this.semanticScholar.searchAuthors(topic, maxResults)
          ]);
          const apiTime = Date.now() - apiStart;

          this.logger.result(`arXiv: ${arxivData.authors.length} authors from ${arxivData.papers.length} papers`);
          this.logger.result(`Semantic Scholar: ${ssAuthors.length} authors`);
          this.logger.success(`API calls completed in ${apiTime}ms`);

          collectedPapers.push(...arxivData.papers);

          const researchers = [
            ...arxivData.authors.slice(0, 10),
            ...ssAuthors.map(a => `${a.name}${a.affiliations?.[0] ? ` (${a.affiliations[0]})` : ''}`)
          ];

          collectedResearchers.push(...researchers);

          functionResponse = {
            researchers: researchers.slice(0, maxResults),
            details: ssAuthors.map(a => ({
              name: a.name,
              affiliation: a.affiliations?.[0],
              papers: a.paperCount,
              citations: a.citationCount,
              hIndex: a.hIndex
            }))
          };
        }
        else if (functionCall.name === 'findResearchersByInstitution') {
          const { institution, topic, maxResults = 20 } = functionCall.args as { institution: string; topic?: string; maxResults?: number };
          this.logger.functionCall('findResearchersByInstitution', { institution, topic, maxResults });

          // Use OpenAlex for institution search
          const searchQuery = topic
            ? `${institution} ${topic}`
            : institution;

          this.logger.apiCall('OpenAlex', `authors?institution=${searchQuery}`);
          this.logger.apiCall('OpenAlex', `works?institution=${institution}`);

          const apiStart = Date.now();
          const [oaAuthors, oaWorks] = await Promise.all([
            this.openAlex.searchAuthorsByInstitution(searchQuery, maxResults),
            this.openAlex.searchWorksByInstitution(institution, 10)
          ]);
          const apiTime = Date.now() - apiStart;

          this.logger.result(`OpenAlex Authors: ${oaAuthors.length} researchers at ${institution}`);
          this.logger.result(`OpenAlex Works: ${oaWorks.length} recent papers`);
          this.logger.success(`API calls completed in ${apiTime}ms`);

          const researchers = oaAuthors.map(a => {
            const affiliation = a.last_known_institution?.display_name || '';
            const concepts = a.x_concepts?.slice(0, 2).map(c => c.display_name).join(', ') || '';
            return `${a.display_name} (${affiliation})${concepts ? ` - ${concepts}` : ''}`;
          });

          collectedResearchers.push(...researchers);

          functionResponse = {
            institution: institution,
            researchers: researchers.slice(0, maxResults),
            details: oaAuthors.map(a => ({
              name: a.display_name,
              affiliation: a.last_known_institution?.display_name,
              works: a.works_count,
              citations: a.cited_by_count,
              research_areas: a.x_concepts?.slice(0, 3).map(c => c.display_name)
            })),
            recentWorks: oaWorks.slice(0, 5).map(w => ({
              title: w.title,
              year: w.publication_year,
              citations: w.cited_by_count
            }))
          };
        }
        else if (functionCall.name === 'analyzeResearchField') {
          const { interests } = functionCall.args as { interests: string[] };
          console.log(`Function call: analyzeResearchField(${interests.join(', ')})`);

          const papers = await this.arxivService.searchPapers(interests.join(' OR '), 15);
          collectedPapers.push(...papers);

          functionResponse = {
            papers: papers.map(p => ({
              title: p.title,
              authors: p.authors.slice(0, 2),
              categories: p.categories
            })),
            themes: [...new Set(papers.flatMap(p => p.categories))].slice(0, 10)
          };
        }

        // Send function response back to the model
        result = await chat.sendMessage([{
          functionResponse: {
            name: functionCall.name,
            response: functionResponse
          }
        }]);

        response = result.response;
      }

      // Get final text response
      try {
        finalText = response.text();
        this.logger.info(`Got final text response: ${finalText.slice(0, 100)}...`);
      } catch (error) {
        this.logger.warn('No text in response, might be function-only response');
        finalText = '';
      }

      const totalTime = Date.now() - startTime;

      this.logger.separator();
      this.logger.success(`COMPLETED in ${totalTime}ms`);
      this.logger.info(`Function calls made: ${functionCallCount}`);
      this.logger.info(`Papers collected: ${collectedPapers.length}`);
      this.logger.info(`Researchers found: ${collectedResearchers.length}`);
      this.logger.info(`Response length: ${finalText.length} characters`);
      this.logger.separator();

      return {
        response: finalText,
        papers: collectedPapers.length > 0 ? collectedPapers : undefined,
        researchers: collectedResearchers.length > 0 ? collectedResearchers : undefined
      };
    } catch (error) {
      this.logger.error('Error calling Gemini API', error);
      throw new Error('Failed to generate AI response');
    }
  }
}
