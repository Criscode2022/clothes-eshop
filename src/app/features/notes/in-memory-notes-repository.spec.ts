import { TestBed } from '@angular/core/testing';
import { InMemoryNotesRepository } from './in-memory-notes-repository';
import { NotesRepository } from './notes-repository';

describe('InMemoryNotesRepository', () => {
  let repository: InMemoryNotesRepository;

  beforeEach(() => {
    repository = TestBed.inject(InMemoryNotesRepository);
  });

  it('is the default NotesRepository until Neon is connected', () => {
    expect(TestBed.inject(NotesRepository)).toBe(repository);
  });

  it('starts with placeholder notes', async () => {
    const notes = await repository.list();

    expect(notes.length).toBeGreaterThan(0);
  });

  it('adds a trimmed note with a new id and a timestamp', async () => {
    const before = await repository.list();

    const added = await repository.add({ title: '  Write the schema  ' });

    expect(added.title).toBe('Write the schema');
    expect(before.map((note) => note.id)).not.toContain(added.id);
    expect(Number.isNaN(Date.parse(added.createdAt))).toBe(false);
    expect(await repository.list()).toEqual([...before, added]);
  });

  it('leaves previously returned lists unchanged', async () => {
    const before = await repository.list();
    const snapshot = [...before];

    await repository.add({ title: 'Another note' });

    expect(before).toEqual(snapshot);
  });
});
