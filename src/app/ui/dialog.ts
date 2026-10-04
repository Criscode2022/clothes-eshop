/**
 * Opens a native dialog as a modal: the browser traps focus, closes it on Escape, and restores focus after.
 * Test DOMs without showModal fall back to the open attribute.
 */
export function openModal(dialog: HTMLDialogElement): void {
  if (dialog.hasAttribute('open')) {
    return;
  }
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

export function closeModal(dialog: HTMLDialogElement): void {
  if (!dialog.hasAttribute('open')) {
    return;
  }
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
  }
}

/** A click that lands on the dialog element itself, not its panel, came from the backdrop. */
export function isBackdropClick(event: MouseEvent, dialog: HTMLDialogElement): boolean {
  return event.target === dialog;
}
