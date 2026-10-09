import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageBubble } from './shared/language-bubble/language-bubble';

@Component({
  imports: [RouterOutlet, LanguageBubble],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('between-u-and-me');
}
