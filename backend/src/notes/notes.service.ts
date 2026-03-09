import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { PROMPTS } from '../ai/prompts';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, createNoteDto: CreateNoteDto) {
    return this.prisma.note.create({
      data: {
        ...createNoteDto,
        userId,
      },
    });
  }

  async findAll(userId: string, query: QueryNotesDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return note;
  }

  async update(id: string, userId: string, updateNoteDto: UpdateNoteDto) {
    await this.findOne(id, userId); // This will throw if not found or not owned

    return this.prisma.note.update({
      where: { id },
      data: updateNoteDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // This will throw if not found or not owned

    await this.prisma.note.delete({
      where: { id },
    });

    return { message: 'Note deleted successfully' };
  }

  async updateSummary(noteId: string, userId: string, summary: string) {
    await this.findOne(noteId, userId); // Ownership check

    return this.prisma.note.update({
      where: { id: noteId },
      data: { summary },
    });
  }

  async updateTags(noteId: string, userId: string, tags: string[]) {
    await this.findOne(noteId, userId); // Ownership check

    return this.prisma.note.update({
      where: { id: noteId },
      data: { tags },
    });
  }

  async summarizeNote(noteId: string, userId: string) {
    const note = await this.findOne(noteId, userId);
    const startTime = Date.now();
    const model = process.env.HF_TEXT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

    try {
      const summary = await this.aiService.generateSummary(note.content);
      const latency = Date.now() - startTime;

      await this.updateSummary(noteId, userId, summary);

      // Audit log
      await this.auditService.createAuditLog({
        userId,
        noteId,
        action: 'summarize',
        model,
        prompt: PROMPTS.summarize(note.content),
        output: summary,
        status: 'success',
        latencyMs: latency,
      });

      return { summary };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      await this.auditService.createAuditLog({
        userId,
        noteId,
        action: 'summarize',
        model,
        prompt: PROMPTS.summarize(note.content),
        status: 'error',
        errorMessage,
        latencyMs: latency,
      });

      this.logger.error(`Error summarizing note ${noteId}: ${errorMessage}`, error.stack);
      throw new BadRequestException(`Failed to generate summary: ${errorMessage}`);
    }
  }

  async generateTagsForNote(noteId: string, userId: string) {
    const note = await this.findOne(noteId, userId);
    const startTime = Date.now();
    const model = process.env.HF_TEXT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

    try {
      const tags = await this.aiService.generateTags(note.content);
      const latency = Date.now() - startTime;

      await this.updateTags(noteId, userId, tags);

      // Audit log
      await this.auditService.createAuditLog({
        userId,
        noteId,
        action: 'tags',
        model,
        prompt: PROMPTS.generateTags(note.content),
        output: JSON.stringify(tags),
        status: 'success',
        latencyMs: latency,
      });

      return { tags };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      await this.auditService.createAuditLog({
        userId,
        noteId,
        action: 'tags',
        model,
        prompt: PROMPTS.generateTags(note.content),
        status: 'error',
        errorMessage,
        latencyMs: latency,
      });

      this.logger.error(`Error generating tags for note ${noteId}: ${errorMessage}`, error.stack);
      throw new BadRequestException(`Failed to generate tags: ${errorMessage}`);
    }
  }
}
