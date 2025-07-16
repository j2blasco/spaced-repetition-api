import { randomUUID } from 'crypto';
import {
  Note,
  NoteId,
  NoteRepository,
  CreateNoteRequest,
  UpdateNoteRequest,
} from './note.interface.js';
import { DeckId } from '../deck/deck.interface.js';

/**
 * In-memory implementation of NoteRepository for testing purposes
 */
export class InMemoryNoteRepository implements NoteRepository {
  private notes: Map<string, Note> = new Map();

  async create(request: CreateNoteRequest): Promise<Note> {
    const id: NoteId = { value: randomUUID() };
    const now = new Date();

    const note: Note = {
      id,
      deckId: request.deckId,
      fields: request.fields,
      tags: request.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.notes.set(id.value, note);
    return note;
  }

  async findById(id: NoteId): Promise<Note | null> {
    return this.notes.get(id.value) || null;
  }

  async findByDeckId(deckId: DeckId): Promise<readonly Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.deckId.value === deckId.value,
    );
  }

  async update(id: NoteId, request: UpdateNoteRequest): Promise<Note> {
    const existingNote = this.notes.get(id.value);
    if (!existingNote) {
      throw new Error(`Note with id '${id.value}' not found`);
    }

    const updatedNote: Note = {
      ...existingNote,
      fields: {
        ...existingNote.fields,
        ...request.fields,
      },
      tags: request.tags ?? existingNote.tags,
      updatedAt: new Date(),
    };

    this.notes.set(id.value, updatedNote);
    return updatedNote;
  }

  async delete(id: NoteId): Promise<void> {
    const exists = this.notes.has(id.value);
    if (!exists) {
      throw new Error(`Note with id '${id.value}' not found`);
    }
    this.notes.delete(id.value);
  }

  async exists(id: NoteId): Promise<boolean> {
    return this.notes.has(id.value);
  }

  async search(deckId: DeckId, query: string): Promise<readonly Note[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.notes.values()).filter(
      (note) =>
        note.deckId.value === deckId.value &&
        (note.fields.front.toLowerCase().includes(queryLower) ||
          note.fields.back.toLowerCase().includes(queryLower) ||
          (note.fields.extra?.toLowerCase().includes(queryLower) ?? false) ||
          note.tags.some((tag) => tag.toLowerCase().includes(queryLower))),
    );
  }

  // Helper method for testing
  clear(): void {
    this.notes.clear();
  }
}
