import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateAuditLogDto {
  userId: string;
  noteId?: string;
  action: string;
  model: string;
  prompt: string;
  output?: string;
  status: 'success' | 'error';
  errorMessage?: string;
  latencyMs?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async createAuditLog(dto: CreateAuditLogDto) {
    try {
      return await this.prisma.aiRequest.create({
        data: {
          userId: dto.userId,
          noteId: dto.noteId,
          action: dto.action,
          model: dto.model,
          prompt: dto.prompt,
          output: dto.output,
          status: dto.status,
          errorMessage: dto.errorMessage,
          latencyMs: dto.latencyMs,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging should not break the main flow
    }
  }
}
