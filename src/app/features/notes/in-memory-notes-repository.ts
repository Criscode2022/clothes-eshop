import { Service } from '@angular/core';
import type { Note, NoteDraft } from './note.model';
import type { NotesRepository } from './notes-repository';

const PLACEHOLDER_NOTES: readonly Note[] = [
  {
    id: 'note-1',
    title: 'This list lives in memory until you connect Neon',
    createdAt: '2026-01-05T09:00:00.000Z',
  },
];

/** Placeholder data source. Notes reset when the page reloads. */
@Service()
export class InMemoryNotesRepository implements NotesRepository {
  private notes = PLACEHOLDER_NOTES;

  async list(): Promise<readonly Note[]> {
    return this.notes;
  }

  async add(draft: NoteDraft): Promise<Note> {
    const note: Note = {
      id: `note-${this.notes.length + 1}`,
      title: draft.title.trim(),
      createdAt: new Date().toISOString(),
    };
    this.notes = [...this.notes, note];
    return note;
  }
}
