import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Impostor } from './pages/impostor/impostor';
import { Nhie } from './pages/neverHaveIEver/nhie';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nhie', component: Nhie },
  { path: 'impostor', component: Impostor },
  { path: '**', redirectTo: '' },
];
