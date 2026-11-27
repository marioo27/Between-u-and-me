import { Component, computed, input } from '@angular/core';
import {
  GAME_ATMOSPHERE,
  GameAtmospherePreset,
  buildGameAtmosphereMotifs,
} from './game-atmosphere.model';

@Component({
  selector: 'app-game-atmosphere',
  styleUrl: './game-atmosphere.css',
  templateUrl: './game-atmosphere.html',
  host: {
    '[style.--atmosphere-paper]': 'theme().paper',
    '[style.--atmosphere-ink]': 'theme().ink',
  },
})
export class GameAtmosphere {
  readonly preset = input.required<GameAtmospherePreset>();

  protected readonly theme = computed(() => GAME_ATMOSPHERE[this.preset()]);
  protected readonly motifs = computed(() => buildGameAtmosphereMotifs(this.preset()));
}
