// public-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayoutComponent } from './playout/playout.component';
import { VegastudioComponent } from './vegastudio/vegastudio.component';
import { RouletteComponent } from './roulette/roulette.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { CreditComponent } from './credit/credit.component';
import { SpintowinComponent } from './spintowin/spintowin.component';
import { TableComponent } from './table/table.component';
import { JeuComponent } from './jeu/jeu.component';
import { ProposComponent } from './propos/propos.component';
import { WebSocketComponent } from './web-socket/web-socket.component'; 
import { RegleComponent } from './regle/regle.component';

// Routage des pages du module Public 
const routes: Routes = [
  {
    path: '', component: PlayoutComponent, children: [ 
      { path: '', redirectTo: 'Vegastudio', pathMatch: 'full' }, // Redirige vers la page d'accueil lorsque le chemin est vide 
      { path: 'Vegastudio', component: VegastudioComponent }, // Charge le composant VegastudioComponent lorsque le chemin est '/Vegastudio'
      { path: 'SpinToWin', component: SpintowinComponent }, // Charge le composant HomeComponent lorsque le chemin est '/home'
      { path: 'roulette', component: RouletteComponent }, // Charge le composant RouletteComponent lorsque le chemin est '/roulette'
      { path: 'register', component: RegisterComponent }, // Charge le composant RegisterComponent lorsque le chemin est '/register'
      { path: 'login', component: LoginComponent }, // Charge le composant LoginComponent lorsque le chemin est '/login'
      { path: 'credit', component: CreditComponent }, // Charge le composant CreditComponent lorsque le chemin est '/credit'
      { path: 'table', component: TableComponent }, // Charge le composant CreditComponent lorsque le chemin est '/table'  // Charge le composant CreditComponent lorsque le chemin est '/table'
     {path: 'Jeu', component: JeuComponent},
     {path: 'propos', component: ProposComponent},
     {path: 'regle', component: RegleComponent},
    ]
  }
];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
