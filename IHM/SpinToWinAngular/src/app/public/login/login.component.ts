import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Importez le service Router
import { PlayoutComponent } from '../playout/playout.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(
    private _httpClient: HttpClient,
    public PLAYERINFO: PlayoutComponent,
    private router: Router // Injectez le service Router
  ) {}

  private allServerURL = 'http://10.22.27.51:8000/player/auth';
  username: string = '';
  password: string = '';
  loginError: boolean = false; // Ajoutez cette ligne

  sendData(): void {
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    const data = {
      pseudo: username,
      motDePasse: password
    };

    this.sendDataToServer(data);
  }

  sendDataToServer(data: any) {
    const headers = new HttpHeaders().set('Content-Type', 'Authorization');

    this._httpClient.put<any>(this.allServerURL, data, { headers: headers })
      .subscribe(
        (response) => {
          console.log('PUT request successful:', response);
          delete response.mot_de_passe_hash;
          
          // Formater la date
          response.dateNaissance = new Date(response.dateNaissance).toISOString().split('T')[0];
          
          this.PLAYERINFO.playerInfo = response;
          console.log('trans', this.PLAYERINFO.playerInfo);
          this.PLAYERINFO.joueurConnecter = true;
          this.router.navigate(['/Jeu']); // Utilisez le service Router pour la navigation
          this.loginError = false; // Reset the error state on success
        },
        (error) => {
          console.error('PUT request error:', error);
          this.loginError = true; // Set the error state on failure
        }
      );
  }

  envoyerUnMessageDepuisLogin() {
    if (this.PLAYERINFO) {
      this.PLAYERINFO.sendTotoMessage();
    }
  }

  afficherLeTchatDepuisLogin() {
    if (this.PLAYERINFO) {
      this.PLAYERINFO.displayChatMessages();
    }
  }

  // // Méthode pour récupérer toutes les données du serveur
  // getAllServers() {
  //   this._httpClient.get(this.allServerURL)
  //     .pipe(
  //       map((response: any) => response.filter((server: any) => server.srv_server_commissionner === true || server.srv_server_commissionner === false)),
  //       map((filteredResponse: any[]) => {
  //         filteredResponse.forEach((server: any) => {
  //           // Traitement supplémentaire des données si nécessaire
  //         });
  //         return filteredResponse;
  //       })
  //     )
  //     .subscribe(filteredResponse => {
  //       // Assigner les données récupérées à une variable ou effectuer un traitement supplémentaire si nécessaire
  //     });
  // }
}
