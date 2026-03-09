export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotesListResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}
