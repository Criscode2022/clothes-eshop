import { inject, Service } from '@angular/core';
import { InMemoryNotesRepository } from './in-memory-notes-repository';
import type { Note, NoteDraft } from './note.model';

/**
 * Data-access boundary for notes. Components inject this class, never a concrete source.
 *
 * Until Neon is connected, the factory serves in-memory placeholder data. To switch, implement
 * this class with the Neon Data API (see the neon-data-api-rls skill) and return it from the
 * factory. The browser never holds a connection string; RLS policies protect each user's rows.
 */
@Service({ factory: () => inject(InMemoryNotesRepository) })
export abstract class NotesRepository {
  abstract list(): Promise<readonly Note[]>;
  abstract add(draft: NoteDraft): Promise<Note>;
}
