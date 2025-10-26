import Anthropic from '@anthropic-ai/sdk';
import { BaseAIService, type AIResponse, type ChatContext } from './base.service.js';
import { ArxivService } from '../arxiv.service.js';
import { SemanticScholarService } from '../semantic-scholar.service.js';
import { OpenAlexService } from '../openalex.service.js';
import { Logger } from '../../utils/logger.js';
import type { ArxivPaper } from '../../types';

export class ClaudeService extends BaseAIService {
  private client: Anthropic;
  private model: string;
  private arxivService: ArxivService;
  private semanticScholar: SemanticScholarService;
  private openAlex: OpenAlexService;
  private logger: Logger;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-5') {
    super();
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.arxivService = new ArxivService();
    this.semanticScholar = new SemanticScholarService();
    this.openAlex = new OpenAlexService();
    this.logger = new Logger('ClaudeService');
  }

  getProviderName(): string {
    return 'Claude';
  }

  getModelName(): string {
    return this.model;
  }

  private getTools(): Anthropic.Tool[] {
    return [
      {
        name: 'searchPapers',
        description: 'Search for research papers across multiple sources (arXiv, Semantic Scholar). Use this when the user asks about papers, publications, or recent research on a topic.',
        input_schema: {
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
        input_schema: {
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
        description: 'Find researchers at a specific university or institution. Use this when the user mentions ANY institution name like "WashU", "Washington University", "MIT", "Stanford", or asks about researchers "at" a specific place.',
        input_schema: {
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
        input_schema: {
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
    this.logger.header(`NEW USER MESSAGE`);
    this.logger.info(`User query: "${message}"`);

    try {
      const messages: Anthropic.MessageParam[] = context.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      messages.push({
        role: 'user',
        content: message
      });

      this.logger.info(`Context history: ${context.length} messages`);

      let collectedPapers: ArxivPaper[] = [];
      let collectedResearchers: string[] = [];
      let functionCallCount = 0;
      const maxIterations = 10;

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        this.logger.info(`Iteration ${iteration + 1}/${maxIterations}`);

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: this.getSystemPrompt(),
          messages,
          tools: this.getTools()
        });

        this.logger.info(`Stop reason: ${response.stop_reason}`);

        // Check if Claude wants to use tools
        if (response.stop_reason === 'tool_use') {
          const toolUses = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
          );

          if (toolUses.length === 0) {
            this.logger.info('🤖 Agent Decision: Responding directly without tools');
            const textBlocks = response.content.filter(
              (block): block is Anthropic.TextBlock => block.type === 'text'
            );
            const finalText = textBlocks.map(block => block.text).join('\n');

            const totalTime = Date.now() - startTime;
            this.logger.separator();
            this.logger.success(`COMPLETED in ${totalTime}ms`);
            this.logger.info(`Function calls made: ${functionCallCount}`);
            this.logger.info(`Papers collected: ${collectedPapers.length}`);
            this.logger.info(`Researchers found: ${collectedResearchers.length}`);
            this.logger.separator();

            return {
              response: finalText,
              papers: collectedPapers.length > 0 ? collectedPapers : undefined,
              researchers: collectedResearchers.length > 0 ? collectedResearchers : undefined
            };
          }

          this.logger.info(`🤖 Agent Decision: Using ${toolUses.length} tool(s) to answer`);

          // Add assistant's response to messages
          messages.push({
            role: 'assistant',
            content: response.content
          });

          // Execute tools
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            functionCallCount++;
            this.logger.separator();
            this.logger.functionCall(toolUse.name, toolUse.input);

            let toolResult: any = {};

            try {
              if (toolUse.name === 'searchPapers') {
                const { query, maxResults = 10 } = toolUse.input as { query: string; maxResults?: number };

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

                toolResult = {
                  arxivPapers: arxivPapers.map(p => ({
                    title: p.title,
                    authors: p.authors.slice(0, 3),
                    year: p.published.split('-')[0],
                    pdfLink: p.pdfLink
                  })),
                  semanticScholarPapers: ssPapers.map(p => ({
                    title: p.title,
                    authors: p.authors.slice(0, 3).map(a => a.name),
                    year: p.year,
                    citations: p.citationCount
                  }))
                };
              } else if (toolUse.name === 'findResearchersByInstitution') {
                const { institution, topic, maxResults = 20 } = toolUse.input as {
                  institution: string;
                  topic?: string;
                  maxResults?: number
                };

                this.logger.apiCall('OpenAlex', `authors?institution=${institution}${topic ? `&topic=${topic}` : ''}`);

                const apiStart = Date.now();
                const oaAuthors = await this.openAlex.searchAuthorsByInstitution(institution, maxResults, topic);
                const apiTime = Date.now() - apiStart;

                this.logger.result(`OpenAlex Authors: ${oaAuthors.length} researchers at ${institution}`);
                this.logger.success(`API calls completed in ${apiTime}ms`);

                const contactInfo = oaAuthors.map(a => this.openAlex.extractContactInfo(a));
                const researchers = contactInfo.map(c => {
                  const affiliation = c.institution || '';
                  const areas = c.researchAreas?.slice(0, 2).join(', ') || '';
                  return `${c.name} (${affiliation})${areas ? ` - ${areas}` : ''}`;
                });

                collectedResearchers.push(...researchers);

                toolResult = {
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
              } else if (toolUse.name === 'findResearchersByTopic') {
                const { topic, maxResults = 15 } = toolUse.input as { topic: string; maxResults?: number };

                this.logger.apiCall('OpenAlex', `authors?topic=${topic}`);

                const apiStart = Date.now();
                const oaAuthors = await this.openAlex.searchAuthors(topic, maxResults);
                const apiTime = Date.now() - apiStart;

                this.logger.result(`OpenAlex: ${oaAuthors.length} authors`);
                this.logger.success(`API calls completed in ${apiTime}ms`);

                const contactInfo = oaAuthors.map(a => this.openAlex.extractContactInfo(a));
                const researchers = contactInfo.map(c => {
                  const affiliation = c.institution || '';
                  const areas = c.researchAreas?.slice(0, 2).join(', ') || '';
                  return `${c.name} (${affiliation})${areas ? ` - ${areas}` : ''}`;
                });

                collectedResearchers.push(...researchers);

                toolResult = {
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
              } else if (toolUse.name === 'analyzeResearchField') {
                const { interests } = toolUse.input as { interests: string[] };
                const allPapers: ArxivPaper[] = [];

                for (const interest of interests.slice(0, 3)) {
                  const papers = await this.arxivService.searchPapers(interest, 5);
                  allPapers.push(...papers);
                }

                collectedPapers.push(...allPapers);

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

                toolResult = {
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
              toolResult = { error: error instanceof Error ? error.message : 'Unknown error' };
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult)
            });
          }

          // Add tool results to messages
          messages.push({
            role: 'user',
            content: toolResults
          });

          this.logger.info(`✅ Tool results sent back to Claude`);
        } else {
          // No more tool calls, get final response
          const textBlocks = response.content.filter(
            (block): block is Anthropic.TextBlock => block.type === 'text'
          );
          const finalText = textBlocks.map(block => block.text).join('\n');

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
        }
      }

      // Max iterations reached
      this.logger.warn(`Max iterations (${maxIterations}) reached`);
      return {
        response: 'I apologize, but I reached the maximum number of steps while processing your request. Please try rephrasing your question.',
        papers: collectedPapers.length > 0 ? collectedPapers : undefined,
        researchers: collectedResearchers.length > 0 ? collectedResearchers : undefined
      };
    } catch (error) {
      this.logger.error('Error calling Claude API', error);
      throw new Error('Failed to generate AI response');
    }
  }
}
