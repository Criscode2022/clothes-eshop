/** A saved note. Mirrors the row a `notes` table returns once Neon backs this feature. */
export interface Note {
  readonly id: string;
  readonly title: string;
  /** ISO 8601 timestamp assigned by the data source. */
  readonly createdAt: string;
}

/** The fields a person fills in. The data source assigns `id` and `createdAt`. */
export interface NoteDraft {
  readonly title: string;
}
