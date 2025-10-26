import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { ChatMessage, ArxivPaper } from '../types';
import { ArxivService } from './arxiv.service.js';
import { SemanticScholarService } from './semantic-scholar.service.js';
import { OpenAlexService } from './openalex.service.js';
import { Logger } from '../utils/logger.js';
import { BaseAIService, type AIResponse, type ChatContext } from './ai/base.service.js';

export class GeminiService extends BaseAIService {
  private genAI: GoogleGenerativeAI;
  private model;
  private modelName: string;
  private arxivService: ArxivService;
  private semanticScholar: SemanticScholarService;
  private openAlex: OpenAlexService;
  private logger: Logger;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    super();
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
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
              type: SchemaType.OBJECT,
              properties: {
                query: {
                  type: SchemaType.STRING,
                  description: 'The search query for papers (e.g., "quantum computing", "machine learning optimization")'
                },
                maxResults: {
                  type: SchemaType.NUMBER,
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
              type: SchemaType.OBJECT,
              properties: {
                topic: {
                  type: SchemaType.STRING,
                  description: 'The research topic or field'
                },
                maxResults: {
                  type: SchemaType.NUMBER,
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
              type: SchemaType.OBJECT,
              properties: {
                institution: {
                  type: SchemaType.STRING,
                  description: 'Institution name (e.g., "Washington University", "WashU", "MIT", "Stanford")'
                },
                topic: {
                  type: SchemaType.STRING,
                  description: 'Optional: filter by research topic/field (e.g., "biomedical", "machine learning")'
                },
                maxResults: {
                  type: SchemaType.NUMBER,
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
              type: SchemaType.OBJECT,
              properties: {
                interests: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING
                  },
                  description: 'List of research interests or topics to analyze'
                }
              },
              required: ['interests']
            }
          }
        ]
      }
    ] as const;

    this.model = this.genAI.getGenerativeModel({
      model: this.modelName,
      tools: tools as any // Type assertion needed due to strict Gemini SDK typing
    });
  }

  getProviderName(): string {
    return 'Gemini';
  }

  getModelName(): string {
    return this.modelName;
  }

  /**
   * Unified chat with automatic function calling
   */
  async chat(message: string, context: ChatContext[]): Promise<AIResponse> {
    const startTime = Date.now();
    this.logger.header(`NEW USER MESSAGE`);
    this.logger.info(`User query: "${message}"`);

    try {
      // Filter out assistant messages that aren't from actual responses (like welcome message)
      // and ensure history starts with a user message
      let chatHistory = context
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }]
        }));

      // Remove leading assistant/model messages - history must start with user
      while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
        chatHistory.shift();
      }

      this.logger.info(`Context history: ${chatHistory.length} messages`);

      const chat = this.model.startChat({
        history: chatHistory,
        systemInstruction: {
          role: 'system',
          parts: [{ text: `You are an autonomous AI research assistant using the ReAct (Reasoning + Acting) framework.

## Your Capabilities:
You operate in a thought → action → observation cycle. You can THINK about what to do, ACT by calling tools, and OBSERVE results.

### Available Tools:
1. **searchPapers**(query, maxResults): Find academic papers on a topic
2. **findResearchersByTopic**(topic, maxResults): Find researchers in a field
3. **findResearchersByInstitution**(institution, topic?, maxResults): Find researchers at a university
4. **analyzeResearchField**(field, interests): Analyze research trends

## Operating Principles:

**When to Use Tools:**
- User asks for specific data (papers, researchers, institutions)
- You need current information from databases
- User mentions a university/institution
- User wants to discover or explore research

**When to Respond Directly:**
- Casual greetings or thanks
- Clarifications or explanations
- Follow-up questions about previous results
- General knowledge questions

**Key Examples:**
- "biomedical researchers at washu" → CALL findResearchersByInstitution(institution="washu", topic="biomedical")
- "papers on quantum computing" → CALL searchPapers(query="quantum computing")
- "hello" → RESPOND directly
- "tell me more about the first researcher" → RESPOND using previous context

## Agent Loop Behavior:
1. **Think**: Reason about what the user needs
2. **Act**: Call tools if needed to get data
3. **Observe**: Process the tool results
4. **Repeat**: Call more tools if needed, or provide final answer

## Presenting Papers:
When you present research papers, use this compact format with the link as a button at the bottom:

**Format:**
### Paper Title
*Authors*
*Year · Citations (if available)*

[📄 View Paper](arxiv_url_or_pdf_link)

## Presenting Researcher Contact Information:
When you find researchers, present them in a **compact, scannable format** using this structure:

**IMPORTANT FORMATTING RULES:**
- Use level 3 headers (###) for researcher names (creates nice headers without too much spacing)
- Put institution and stats on ONE line using italic formatting
- Create clickable buttons for ALL available links using markdown link format with emoji icons
- Group all buttons on a single line separated by spaces
- Keep it tight - no extra blank lines between sections

**Example Format:**
Level 3 header: Dr. Jane Smith
Italic line: MIT · 5,234 citations · 127 publications

Button line: [icon Google Scholar](link) [icon ORCID](link) [icon Homepage](link) [icon OpenAlex](link)

Bold Research: Machine Learning, Computer Vision

**Key Points:**
- One researcher = one compact block (name, stats line, buttons, research areas)
- All buttons on ONE line for easy clicking
- Use middle dot (·) to separate inline stats
- Keep descriptions brief

You are autonomous - make your own decisions about when to use tools. Be proactive and thorough.` }]
        }
      });

      this.logger.info('Sending message to Gemini...');
      let result = await chat.sendMessage(message);
      let response = result.response;

      // Debug logging
      this.logger.info(`Response object keys: ${Object.keys(response).join(', ')}`);

      // Check for function calls in candidates
      const candidates = response.candidates || [];
      this.logger.info(`Number of candidates: ${candidates.length}`);

      if (candidates.length > 0) {
        const firstCandidate = candidates[0];
        this.logger.info(`First candidate keys: ${Object.keys(firstCandidate).join(', ')}`);

        if (firstCandidate.content && firstCandidate.content.parts) {
          this.logger.info(`Number of parts: ${firstCandidate.content.parts.length}`);
          firstCandidate.content.parts.forEach((part: any, idx: number) => {
            this.logger.info(`Part ${idx} keys: ${Object.keys(part).join(', ')}`);
            if (part.functionCall) {
              this.logger.info(`Part ${idx} has functionCall: ${part.functionCall.name}`);
            }
          });
        }
      }

      this.logger.info(`Response has functionCalls: ${!!response.functionCalls}`);
      this.logger.info(`functionCalls type: ${typeof response.functionCalls}`);
      if (response.functionCalls && Array.isArray(response.functionCalls)) {
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

      // Extract function calls from response
      const getFunctionCalls = (resp: any) => {
        // Try multiple ways to get function calls
        if (resp.functionCalls && Array.isArray(resp.functionCalls)) {
          return resp.functionCalls;
        }

        // Check in candidates
        if (resp.candidates && resp.candidates[0]?.content?.parts) {
          const functionCalls = resp.candidates[0].content.parts
            .filter((part: any) => part.functionCall)
            .map((part: any) => part.functionCall);
          if (functionCalls.length > 0) {
            return functionCalls;
          }
        }

        return null;
      };

      // Handle function calls
      let functionCalls = getFunctionCalls(response);

      if (!functionCalls || functionCalls.length === 0) {
        this.logger.info('🤖 Agent Decision: Responding directly without tools');
      } else {
        this.logger.info(`🤖 Agent Decision: Using ${functionCalls.length} tool(s) to answer`);
      }

      while (functionCalls && functionCalls.length > 0) {
        functionCallCount++;
        this.logger.separator();
        const functionCall = functionCalls[0];

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

          // Use OpenAlex for institution search with topic filter
          this.logger.apiCall('OpenAlex', `authors?institution=${institution}${topic ? `&topic=${topic}` : ''}`);
          this.logger.apiCall('OpenAlex', `works?institution=${institution}`);

          const apiStart = Date.now();
          const [oaAuthors, oaWorks] = await Promise.all([
            this.openAlex.searchAuthorsByInstitution(institution, maxResults, topic),
            this.openAlex.searchWorksByInstitution(institution, 10)
          ]);
          const apiTime = Date.now() - apiStart;

          this.logger.result(`OpenAlex Authors: ${oaAuthors.length} researchers at ${institution}`);
          this.logger.result(`OpenAlex Works: ${oaWorks.length} recent papers`);
          this.logger.success(`API calls completed in ${apiTime}ms`);

          // Extract detailed contact information for each researcher
          const contactInfo = oaAuthors.map(a => this.openAlex.extractContactInfo(a));

          const researchers = contactInfo.map(c => {
            const affiliation = c.institution || '';
            const areas = c.researchAreas?.slice(0, 2).join(', ') || '';
            return `${c.name} (${affiliation})${areas ? ` - ${areas}` : ''}`;
          });

          collectedResearchers.push(...researchers);

          functionResponse = {
            institution: institution,
            researchers: researchers.slice(0, maxResults),
            contacts: contactInfo.map(c => ({
              name: c.name,
              institution: c.institution,
              email: c.email,
              orcid: c.orcid,
              googleScholar: c.googleScholar,
              homepage: c.homepage,
              twitter: c.twitter,
              wikipedia: c.wikipedia,
              openAlexProfile: c.openAlexProfile,
              scopusProfile: c.scopusProfile,
              citations: c.citations,
              publications: c.publications,
              researchAreas: c.researchAreas
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
        functionCalls = getFunctionCalls(response);

        if (functionCalls && functionCalls.length > 0) {
          this.logger.info(`🔄 Agent Decision: Calling another tool (${functionCalls[0].name})`);
        } else {
          this.logger.info('✅ Agent Decision: Done with tools, preparing final response');
        }
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
