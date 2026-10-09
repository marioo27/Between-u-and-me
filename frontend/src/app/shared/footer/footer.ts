import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n';

@Component({
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly t = inject(I18nService).t;
}
