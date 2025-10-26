import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { BaseAIService, type AIResponse, type ChatContext } from './base.service.js';
import { ArxivService } from '../arxiv.service.js';
import { SemanticScholarService } from '../semantic-scholar.service.js';
import { OpenAlexService } from '../openalex.service.js';
import { Logger } from '../../utils/logger.js';
import type { ArxivPaper } from '../../types';

export class OpenAIService extends BaseAIService {
  private client: OpenAI;
  private model: string;
  private arxivService: ArxivService;
  private semanticScholar: SemanticScholarService;
  private openAlex: OpenAlexService;
  private logger: Logger;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    super();
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.arxivService = new ArxivService();
    this.semanticScholar = new SemanticScholarService();
    this.openAlex = new OpenAlexService();
    this.logger = new Logger('OpenAIService');
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  getModelName(): string {
    return this.model;
  }

  private getTools(): ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'searchPapers',
          description: 'Search for academic papers on a specific topic using arXiv and Semantic Scholar',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query for papers'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 10
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'findResearchersByTopic',
          description: 'Find researchers working in a specific field or topic',
          parameters: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'The research topic or field'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of researchers to return',
                default: 15
              }
            },
            required: ['topic']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'findResearchersByInstitution',
          description: 'Find researchers at a specific university or institution. Use this when the user mentions ANY institution name, abbreviation, or asks about researchers "at" a place.',
          parameters: {
            type: 'object',
            properties: {
              institution: {
                type: 'string',
                description: 'The institution name or abbreviation (e.g., "WashU", "MIT", "Stanford")'
              },
              topic: {
                type: 'string',
                description: 'Optional: Filter by research topic/field'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of researchers to return',
                default: 20
              }
            },
            required: ['institution']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'analyzeResearchField',
          description: 'Analyze trends and opportunities in a research field',
          parameters: {
            type: 'object',
            properties: {
              interests: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of research interests or topics to analyze'
              }
            },
            required: ['interests']
          }
        }
      }
    ];
  }

  private getSystemPrompt(): string {
    return `You are an autonomous AI research assistant using the ReAct (Reasoning + Acting) framework.

## Your Capabilities:
You operate in a thought → action → observation cycle. You can THINK about what to do, ACT by calling tools, and OBSERVE results.

### Available Tools:
1. **searchPapers**(query, maxResults): Find academic papers on a topic
2. **findResearchersByTopic**(topic, maxResults): Find researchers in a field
3. **findResearchersByInstitution**(institution, topic?, maxResults): Find researchers at a university
4. **analyzeResearchField**(interests): Analyze research trends

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

You are autonomous - make your own decisions about when to use tools. Be proactive and thorough.`;
  }

  async chat(message: string, context: ChatContext[]): Promise<AIResponse> {
    const startTime = Date.now();
    this.logger.header('NEW USER MESSAGE');
    this.logger.info(`User query: "${message}"`);
    this.logger.info(`Context history: ${context.length} messages`);

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: this.getSystemPrompt() },
      ...context.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    let collectedPapers: ArxivPaper[] = [];
    let collectedResearchers: string[] = [];
    let functionCallCount = 0;
    const maxIterations = 10;

    this.logger.info('Sending message to OpenAI...');

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: this.getTools(),
        tool_choice: 'auto'
      });

      const responseMessage = response.choices[0].message;
      const toolCalls = responseMessage.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        // No more tool calls - return final response
        this.logger.info('🤖 Agent Decision: Responding directly without tools');
        const totalTime = Date.now() - startTime;

        this.logger.separator();
        this.logger.success(`COMPLETED in ${totalTime}ms`);
        this.logger.info(`Function calls made: ${functionCallCount}`);
        this.logger.info(`Papers collected: ${collectedPapers.length}`);
        this.logger.info(`Researchers found: ${collectedResearchers.length}`);
        this.logger.separator();

        return {
          response: responseMessage.content || 'No response',
          papers: collectedPapers.length > 0 ? collectedPapers : undefined,
          researchers: collectedResearchers.length > 0 ? collectedResearchers : undefined
        };
      }

      // Process tool calls
      this.logger.info(`🤖 Agent Decision: Using ${toolCalls.length} tool(s) to answer`);

      // Add assistant message to history
      messages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        functionCallCount++;
        this.logger.separator();

        // Check if it's a function tool call
        if (toolCall.type !== 'function') continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        this.logger.functionCall(functionName, functionArgs);

        let functionResult: any = {};

        try {
          // Execute the tool
          if (functionName === 'searchPapers') {
            const { query, maxResults = 10 } = functionArgs;
            const [arxivPapers, ssPapers] = await Promise.all([
              this.arxivService.searchPapers(query, maxResults),
              this.semanticScholar.searchPapers(query, Math.min(maxResults, 5))
            ]);

            collectedPapers.push(...arxivPapers);

            functionResult = {
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
          } else if (functionName === 'findResearchersByInstitution') {
            const { institution, topic, maxResults = 20 } = functionArgs;
            const [oaAuthors] = await Promise.all([
              this.openAlex.searchAuthorsByInstitution(institution, maxResults, topic)
            ]);

            const contactInfo = oaAuthors.map(a => this.openAlex.extractContactInfo(a));
            const researchers = contactInfo.map(c => {
              const affiliation = c.institution || '';
              const areas = c.researchAreas?.slice(0, 2).join(', ') || '';
              return `${c.name} (${affiliation})${areas ? ` - ${areas}` : ''}`;
            });

            collectedResearchers.push(...researchers);

            functionResult = {
              institution,
              researchers: researchers.slice(0, maxResults),
              contacts: contactInfo.map(c => ({
                name: c.name,
                institution: c.institution,
                orcid: c.orcid,
                googleScholar: c.googleScholar,
                homepage: c.homepage,
                citations: c.citations,
                publications: c.publications,
                researchAreas: c.researchAreas
              }))
            };
          } else if (functionName === 'findResearchersByTopic') {
            const { topic, maxResults = 15 } = functionArgs;
            const oaAuthors = await this.openAlex.searchAuthors(topic, maxResults);

            const contactInfo = oaAuthors.map(a => this.openAlex.extractContactInfo(a));
            const researchers = contactInfo.map(c => {
              const affiliation = c.institution || '';
              const areas = c.researchAreas?.slice(0, 2).join(', ') || '';
              return `${c.name} (${affiliation})${areas ? ` - ${areas}` : ''}`;
            });

            collectedResearchers.push(...researchers);

            functionResult = {
              topic,
              researchers: researchers.slice(0, maxResults),
              contacts: contactInfo.map(c => ({
                name: c.name,
                institution: c.institution,
                orcid: c.orcid,
                googleScholar: c.googleScholar,
                homepage: c.homepage,
                citations: c.citations,
                publications: c.publications,
                researchAreas: c.researchAreas
              }))
            };
          } else if (functionName === 'analyzeResearchField') {
            const { interests } = functionArgs;
            const allPapers: ArxivPaper[] = [];

            // Search papers for each interest
            for (const interest of interests.slice(0, 3)) {
              const papers = await this.arxivService.searchPapers(interest, 5);
              allPapers.push(...papers);
            }

            collectedPapers.push(...allPapers);

            // Summarize findings
            const topAuthors = new Map<string, number>();
            allPapers.forEach(paper => {
              paper.authors.forEach(author => {
                topAuthors.set(author, (topAuthors.get(author) || 0) + 1);
              });
            });

            const sortedAuthors = Array.from(topAuthors.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([name, count]) => ({ name, papers: count }));

            functionResult = {
              interests,
              totalPapers: allPapers.length,
              recentPapers: allPapers.slice(0, 10).map(p => ({
                title: p.title,
                authors: p.authors.slice(0, 3),
                year: p.published.split('-')[0]
              })),
              topAuthors: sortedAuthors,
              summary: `Analyzed ${allPapers.length} papers across ${interests.length} research interests`
            };
          }

          this.logger.success('Tool execution completed');
        } catch (error) {
          this.logger.error(`Tool execution failed: ${error}`);
          functionResult = { error: String(error) };
        }

        // Add tool result to messages
        messages.push({
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult)
        });
      }
    }

    // Max iterations reached
    this.logger.warn(`Reached maximum iterations (${maxIterations})`);
    return {
      response: 'I apologize, but I reached the maximum number of reasoning steps. Please try rephrasing your question.',
      papers: collectedPapers.length > 0 ? collectedPapers : undefined,
      researchers: collectedResearchers.length > 0 ? collectedResearchers : undefined
    };
  }
}
