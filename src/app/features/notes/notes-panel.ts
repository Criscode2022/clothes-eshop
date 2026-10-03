import { DatePipe } from '@angular/common';
import { Component, computed, ErrorHandler, inject, resource, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import type { NoteDraft } from './note.model';
import { NotesRepository } from './notes-repository';

const TITLE_MAX_LENGTH = 120;
const MISSING_TITLE_MESSAGE = 'Enter a title for the note.';

@Component({
  selector: 'app-notes-panel',
  imports: [DatePipe, FormField, FormRoot],
  templateUrl: './notes-panel.html',
  styleUrl: './notes-panel.scss',
})
export class NotesPanel {
  private readonly repository = inject(NotesRepository);
  private readonly errorHandler = inject(ErrorHandler);

  protected readonly notes = resource({
    loader: () => this.repository.list(),
    defaultValue: [],
  });

  /** Read by screen readers through a polite live region after each save. */
  protected readonly announcement = signal('');

  private readonly draft = signal<NoteDraft>({ title: '' });

  protected readonly noteForm = form(
    this.draft,
    (note) => {
      required(note.title, { message: MISSING_TITLE_MESSAGE });
      pattern(note.title, /\S/, { message: MISSING_TITLE_MESSAGE });
      maxLength(note.title, TITLE_MAX_LENGTH, {
        message: `Use ${TITLE_MAX_LENGTH} characters or fewer.`,
      });
    },
    { submission: { action: (noteForm) => this.save(noteForm().value()) } },
  );

  protected readonly titleError = computed(() => {
    const title = this.noteForm.title();
    return title.touched() ? title.errors()[0] : undefined;
  });

  private async save(draft: NoteDraft) {
    try {
      const note = await this.repository.add(draft);
      this.announcement.set(`Added “${note.title}”.`);
    } catch (error) {
      this.errorHandler.handleError(error);
      return { kind: 'save-failed', message: 'The note was not saved. Try again.' };
    }
    this.noteForm().reset({ title: '' });
    this.notes.reload();
    return undefined;
  }
}
