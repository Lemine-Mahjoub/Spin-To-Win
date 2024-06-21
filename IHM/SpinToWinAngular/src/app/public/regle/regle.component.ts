import { Component } from '@angular/core';
import { PlayoutComponent } from '../playout/playout.component';

@Component({
  selector: 'app-regle',
  standalone: true,
  imports: [],
  templateUrl: './regle.component.html',
  styleUrl: './regle.component.css'
})
export class RegleComponent {

  constructor(
    public PLAYERINFO: PlayoutComponent,
    
  ) {
    // Initialisation de la page
    this.PLAYERINFO.pageCharger = 0;}
     
}
