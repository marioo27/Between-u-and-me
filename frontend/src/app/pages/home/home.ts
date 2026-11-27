import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n';
import { GameAtmosphere } from '../../shared/game-atmosphere/game-atmosphere';
import { GAME_ATMOSPHERE } from '../../shared/game-atmosphere/game-atmosphere.model';
import { SiteMenu } from '../../shared/site-menu/site-menu';

@Component({
  imports: [RouterLink, SiteMenu, GameAtmosphere],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
  host: {
    '[style.--atmosphere-paper]': 'atm.paper',
    '[style.--atmosphere-ink]': 'atm.ink',
    '[style.background]': 'atm.paper',
  },
})
export class Home {
  protected readonly atm = GAME_ATMOSPHERE.home;
  protected readonly t = inject(I18nService).t;
}
