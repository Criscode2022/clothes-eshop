import { Component } from '@angular/core';
import { NotesPanel } from '../../features/notes/notes-panel';

@Component({
  selector: 'app-home',
  imports: [NotesPanel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
