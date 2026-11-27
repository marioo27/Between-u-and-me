import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Impostor } from './pages/impostor/impostor';
import { Nhie } from './pages/neverHaveIEver/nhie';
import { RoomHub } from './pages/room/room-hub';
import { RoomShell } from './pages/room/room-shell';
import { WhoAmI } from './pages/whoAmI/whoami';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nhie', component: Nhie },
  { path: 'impostor', component: Impostor },
  { path: 'whoami', component: WhoAmI },
  { path: 'room', component: RoomHub },
  { path: 'room/:code', component: RoomShell },
  { path: '**', redirectTo: '' },
];
