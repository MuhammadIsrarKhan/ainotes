import { Injectable, Logger } from '@nestjs/common';
import { InferenceClient } from '@huggingface/inference';
import { PROMPTS } from './prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly hf: InferenceClient;
  private readonly model: string;

  constructor() {
    const token = process.env.HF_TOKEN;
    if (!token) {
      this.logger.warn('HF_TOKEN not set. AI features will not work.');
    }
    this.hf = new InferenceClient(token);
    this.model = process.env.HF_TEXT_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
  }

  async generateSummary(content: string): Promise<string> {
    const startTime = Date.now();
    try {
      const prompt = PROMPTS.summarize(content);

      const response = await this.hf.chatCompletion({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const generatedText = response.choices[0]?.message?.content ?? '';
      const summary = generatedText
        .trim()
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 7)
        .join('\n');

      const latency = Date.now() - startTime;
      this.logger.log(`Summary generated in ${latency}ms`);

      return summary || 'Unable to generate summary';
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        stack?: string;
        httpResponse?: { status?: number; body?: unknown };
      };
      const status = err.httpResponse?.status;
      const body = err.httpResponse?.body;
      this.logger.error(
        `Error generating summary: ${err.message}${status ? ` (HTTP ${status})` : ''}${body ? ` - ${JSON.stringify(body)}` : ''}`,
        err.stack,
      );
      throw error;
    }
  }

  async generateTags(content: string): Promise<string[]> {
    const startTime = Date.now();
    try {
      const prompt = PROMPTS.generateTags(content);

      const response = await this.hf.chatCompletion({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.5,
      });

      const output = (response.choices[0]?.message?.content ?? '').trim();

      // Try to extract JSON array from the response
      let tags: string[] = [];

      // Look for JSON array pattern
      const jsonMatch = output.match(/\[.*?\]/s);
      if (jsonMatch) {
        try {
          tags = JSON.parse(jsonMatch[0]);
          if (!Array.isArray(tags)) {
            tags = [];
          }
        } catch (e) {
          this.logger.warn('Failed to parse JSON from tags response', e);
        }
      }

      // Fallback: extract words that look like tags
      if (tags.length === 0) {
        tags = output
          .split(/[,\n]/)
          .map((tag) =>
            tag
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, ''),
          )
          .filter((tag) => tag.length > 0 && tag.length < 20)
          .slice(0, 8);
      }

      // Ensure tags are lowercase and valid
      tags = tags
        .map((tag) => String(tag).toLowerCase().trim())
        .filter((tag) => tag.length > 0 && tag.length < 30)
        .slice(0, 8);

      const latency = Date.now() - startTime;
      this.logger.log(`Tags generated in ${latency}ms: ${tags.join(', ')}`);

      return tags.length > 0 ? tags : ['untagged'];
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        stack?: string;
        httpResponse?: { status?: number; body?: unknown };
      };
      const status = err.httpResponse?.status;
      const body = err.httpResponse?.body;
      this.logger.error(
        `Error generating tags: ${err.message}${status ? ` (HTTP ${status})` : ''}${body ? ` - ${JSON.stringify(body)}` : ''}`,
        err.stack,
      );
      throw error;
    }
  }
}
