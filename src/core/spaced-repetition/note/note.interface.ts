import { DeckId } from '../deck/deck.interface.js';

export type NoteId = string;

export interface NoteFields {
  readonly front: string;
  readonly back: string;
  readonly extra?: string;
}

export interface Note {
  readonly id: NoteId;
  readonly deckId: DeckId;
  readonly fields: NoteFields;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateNoteRequest {
  readonly deckId: DeckId;
  readonly fields: NoteFields;
  readonly tags?: readonly string[];
}

export interface UpdateNoteRequest {
  readonly fields?: Partial<NoteFields>;
  readonly tags?: readonly string[];
}

export interface NoteRepository {
  /**
   * Create a new note
   */
  create(request: CreateNoteRequest): Promise<Note>;

  /**
   * Find a note by ID
   */
  findById(id: NoteId): Promise<Note | null>;

  /**
   * Find all notes in a deck
   */
  findByDeckId(deckId: DeckId): Promise<readonly Note[]>;

  /**
   * Update an existing note
   */
  update(id: NoteId, request: UpdateNoteRequest): Promise<Note>;

  /**
   * Delete a note
   */
  delete(id: NoteId): Promise<void>;

  /**
   * Check if a note exists
   */
  exists(id: NoteId): Promise<boolean>;

  /**
   * Search notes by content
   */
  search(deckId: DeckId, query: string): Promise<readonly Note[]>;
}
