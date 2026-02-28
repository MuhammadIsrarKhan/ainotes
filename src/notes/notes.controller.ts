import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  create(@CurrentUser() user: any, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(user.id, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes with pagination and search' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  findAll(@CurrentUser() user: any, @Query() query: QueryNotesDto) {
    return this.notesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiResponse({ status: 200, description: 'Note retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, user.id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notesService.remove(id, user.id);
  }

  @Post(':id/summarize')
  @ApiOperation({ summary: 'Generate AI summary for a note' })
  @ApiResponse({ status: 200, description: 'Summary generated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async summarize(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notesService.summarizeNote(id, user.id);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Generate AI tags for a note' })
  @ApiResponse({ status: 200, description: 'Tags generated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async generateTags(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notesService.generateTagsForNote(id, user.id);
  }
}
