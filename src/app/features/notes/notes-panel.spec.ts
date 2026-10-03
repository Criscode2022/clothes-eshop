import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Note, NoteDraft } from './note.model';
import { NotesPanel } from './notes-panel';
import { NotesRepository } from './notes-repository';

const SAVED_NOTE: Note = {
  id: 'note-1',
  title: 'Sketch the schema',
  createdAt: '2026-01-05T09:00:00.000Z',
};

class FakeNotesRepository implements NotesRepository {
  notes: readonly Note[] = [SAVED_NOTE];
  failNextList = false;
  failNextAdd = false;

  async list(): Promise<readonly Note[]> {
    if (this.failNextList) {
      this.failNextList = false;
      throw new Error('Neon is unreachable');
    }
    return this.notes;
  }

  async add(draft: NoteDraft): Promise<Note> {
    if (this.failNextAdd) {
      this.failNextAdd = false;
      throw new Error('Neon is unreachable');
    }
    const note = {
      id: `note-${this.notes.length + 1}`,
      title: draft.title,
      createdAt: SAVED_NOTE.createdAt,
    };
    this.notes = [...this.notes, note];
    return note;
  }
}

describe('NotesPanel', () => {
  let repository: FakeNotesRepository;
  let errorHandler: { handleError: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<NotesPanel>;
  let element: HTMLElement;

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(NotesPanel);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function submitTitle(title: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('#note-title')!;
    input.value = title;
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
  }

  function noteTitles(): string[] {
    return [...element.querySelectorAll('.note-list__title')].map((title) =>
      title.textContent!.trim(),
    );
  }

  beforeEach(() => {
    repository = new FakeNotesRepository();
    errorHandler = { handleError: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: NotesRepository, useValue: repository },
        { provide: ErrorHandler, useValue: errorHandler },
      ],
    });
  });

  it('lists the notes from the repository', async () => {
    await render();

    expect(noteTitles()).toEqual(['Sketch the schema']);
  });

  it('adds a note, clears the field, and announces the result', async () => {
    await render();

    await submitTitle('Add a notes table');

    expect(noteTitles()).toEqual(['Sketch the schema', 'Add a notes table']);
    expect(element.querySelector<HTMLInputElement>('#note-title')!.value).toBe('');
    expect(element.querySelector('[role="status"]')!.textContent).toContain(
      'Added “Add a notes table”.',
    );
  });

  it('rejects a blank title without calling the repository', async () => {
    await render();
    const add = vi.spyOn(repository, 'add');

    await submitTitle('   ');

    const input = element.querySelector('#note-title')!;
    expect(add).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(
      element.querySelector(`#${input.getAttribute('aria-describedby')}`)!.textContent,
    ).toContain('Enter a title for the note.');
  });

  it('keeps the draft and shows an alert when saving fails', async () => {
    await render();
    repository.failNextAdd = true;

    await submitTitle('Add a notes table');

    expect(element.querySelector('[role="alert"]')!.textContent).toContain(
      'The note was not saved.',
    );
    expect(element.querySelector<HTMLInputElement>('#note-title')!.value).toBe('Add a notes table');
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('offers a retry when the notes fail to load', async () => {
    repository.failNextList = true;
    await render();

    expect(element.querySelector('[role="alert"]')!.textContent).toContain(
      'The notes did not load.',
    );

    element.querySelector<HTMLButtonElement>('.notes__status button')!.click();
    await fixture.whenStable();

    expect(noteTitles()).toEqual(['Sketch the schema']);
  });
});
