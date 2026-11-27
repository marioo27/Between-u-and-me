import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandSplash } from './shared/brand-splash/brand-splash';

@Component({
  imports: [RouterOutlet, BrandSplash],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('between-u-and-me');
  protected readonly splashDone = signal(false);

  protected onSplashClosed(): void {
    this.splashDone.set(true);
  }
}
