import { Component, OnInit, ViewChild, ElementRef, Renderer2, AfterViewInit, OnDestroy, SimpleChanges } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { PlayoutComponent } from "../playout/playout.component";
import { WebSocketService } from '../web-socket.service';  // Importez le service WebSocket
import { Subscription } from 'rxjs';
import { bannedWords } from "../banWord";

@Component({
  selector: "app-roulette",
  templateUrl: "./roulette.component.html",
  styleUrls: ["./roulette.component.css"],
})
export class RouletteComponent implements OnInit, AfterViewInit, OnDestroy {
  paths: string[] = [];
  finalAngle: number = 0;
  tab = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  ballFalling: number | null = null; 
  betscopy: any[] = []; 
  private allServerURL = 'http://valentin:8000/game/playe';
  private subscription: Subscription | null = null;  // Ajout de la souscription
  
  @ViewChild("ball") ball!: ElementRef<SVGCircleElement>;
  @ViewChild("spinButton") spinButton!: ElementRef<HTMLButtonElement>;
  etatPartieService: any;

  constructor(
    private httpClient: HttpClient,
    private renderer: Renderer2,
    private router: Router,
    public PLAYERINFO: PlayoutComponent,
    private webSocketService: WebSocketService  // Injection du service WebSocket
  ) {
    this.PLAYERINFO.pageCharger = 0;
  }

  ngOnInit() { 
    console.log("tab",this.PLAYERINFO.tableauparie)
    if(!this.PLAYERINFO.joueurConnecter){this.router.navigate(['/login']);}
    if ( this.router.url === '/roulette') {
      // Si le joueur est connecté, commencez à générer les chemins et démarrez l'animation
      this.generatePaths();
      this.startAnimation();
     
  
     
    this.subscription = this.PLAYERINFO.etatPartie$.subscribe((num: number | undefined) => {
      if (num === 1) {
        // Redirigez vers le composant '/table' si l'état de la partie est 1
        this.router.navigate(['/table']);
      }
    });
  }
  }
  

  ngAfterViewInit() {
    if (this.ball && this.ball.nativeElement && this.spinButton && this.spinButton.nativeElement) {
      this.renderer.listen(this.spinButton.nativeElement, 'click', () => {
        this.startAnimation();
      });
    } else {
      console.error('Error: ball or spinButton reference is undefined or their native elements are undefined.');
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
     
    this.PLAYERINFO.tableauparie = []; 
  }

  getBall(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      // Vérifiez si randomNumber est défini
      if (this.PLAYERINFO.randomNumber !== undefined) {
        // Si randomNumber est défini, résolvez la promesse avec sa valeur
        resolve(this.PLAYERINFO.randomNumber);
      } else {
        // Si randomNumber est indéfini, rejetez la promesse avec un message d'erreur
        reject(new Error("Le nombre aléatoire n'est pas défini."));
      }
    });
  }
  

 

  generatePaths(): void {
    const numSlices = 37;
    const sliceDegree = 360 / numSlices;
    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceDegree - 85;
      const endAngle = startAngle + sliceDegree;
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;

      const start = this.polarToCartesian(100, startAngle);
      const end = this.polarToCartesian(100, endAngle);

      const path = `M 0 0 L ${start.x} ${start.y} A 100 100 0 ${largeArc} 1 ${end.x} ${end.y} L 0 0`;
      this.paths.push(path);
    }
  }

  startAnimation() {
    this.getBall().then(randomSliceIndex => {
      const sliceDegree = 360 / 37;
      this.finalAngle = 1080 + randomSliceIndex * sliceDegree;
      console.log(this.tab[randomSliceIndex]);
      this.animateBall(this.finalAngle, this.tab[randomSliceIndex]);
      
    }).catch(error => {
      console.error('Error during animation:', error);
    });
  }
  animateBall(angle: number, ball: number) {
    if (this.ball && this.ball.nativeElement) {
      this.renderer.removeStyle(this.ball.nativeElement, 'transition');
      this.renderer.removeStyle(this.ball.nativeElement, 'transform');
      setTimeout(() => {
        this.renderer.setStyle(
          this.ball.nativeElement,
          'transition',
          'transform 4s ease-out',
        );
        this.renderer.setStyle(
          this.ball.nativeElement,
          'transform',
          `rotate(${angle}deg)`,
        );
      }, 100);
    
      // Écouter la fin de la transition
      this.renderer.listen(this.ball.nativeElement, 'transitionend', () => {
        // Mettre à jour ballFalling une fois que l'animation est terminée
        this.calculGains(ball);
        this.ballFalling = ball; 
        console.log(this.ballFalling);
      });
    } else {
      console.error('Error: ball reference is undefined or its native element is undefined.');
    }
  }
  

  polarToCartesian(
    radius: number,
    angleInDegrees: number,
  ): { x: number; y: number } {
    const angleInRadians = ((angleInDegrees + 90) * Math.PI) / 180.0;
    return {
      x: radius * Math.cos(angleInRadians),
      y: radius * Math.sin(angleInRadians),
    };
  }

  WichIndiceInTab(numero: number) {
    let i = 0;
    for (i; i <= 36; i++) {
      if (this.tab[i] === numero) {
        return i;
      }
    }
    return -1;
  }

  calculGains(ball: number) {
    if (this.PLAYERINFO.tableauparie) {
      this.PLAYERINFO.oldCredit=this.PLAYERINFO.playerInfo.credit;
      this.betscopy = this.PLAYERINFO.tableauparie; // Affecter la valeur de this.PLAYERINFO.tableauparie à this.bets
      const formattedJson = {
        name: this.PLAYERINFO.playerInfo.pseudo, // Récupérer le pseudo du joueur
        credits: this.PLAYERINFO.playerInfo.credit, // Récupérer les crédits du joueur
        ballNumber: ball,
        bets: this.betscopy
      };
  
      console.log(JSON.stringify(formattedJson));
  
      // Appeler la fonction pour envoyer les données au serveur
      this.gameResult(formattedJson);
    } else {
      console.error('Error: this.PLAYERINFO.tableauparie is undefined.');
    }
  }
  
  gameResult(data: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json'); // Correction du type de contenu
  
    this.httpClient.put<any>(this.allServerURL, data, { headers: headers })
      .subscribe(
        (response) => {
          console.log('PUT request successful:', response);
          delete response.mot_de_passe_hash;
  
          // Mettre à jour les informations du joueur
          this.PLAYERINFO.playerInfo = response;
       
        },
        (error) => {
          console.error('PUT request error:', error);
        }
      );
  }
  
  red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  black = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  green = [0];
  
 isCreditInRed(): boolean {
    return this.ballFalling !== null && this.red.includes(this.ballFalling);
  }

  isCreditInBlack(): boolean {
    return this.ballFalling !== null && this.black.includes(this.ballFalling);
  }

  isCreditInGreen(): boolean {
    return this.ballFalling !== null && this.green.includes(this.ballFalling);
  }

  getCreditDifference(): number {
    console.log('oldcredit',this.PLAYERINFO.oldCredit)
   if (!this.PLAYERINFO.oldCredit){return 0;}
    else{return (this.PLAYERINFO.playerInfo.credit || 0) - (this.PLAYERINFO.oldCredit || 0);}
  }


  
  
 
  envoyerUnMessage() {
    if (this.PLAYERINFO.messageInput.trim() !== '') {
      const pseudo = this.PLAYERINFO.playerInfo?.pseudo;
      if (pseudo) {
        const messageToSend = pseudo + " | " + this.PLAYERINFO.messageInput;
  
        // Vérifiez si le message contient un mot banni
        const messageContainsBannedWord = bannedWords.some((bannedWord: string) =>
          messageToSend.toLowerCase().includes(bannedWord.toLowerCase())
        );
  
        if (messageContainsBannedWord) {
          this.PLAYERINFO.messageInput = '';
          alert('Message de la france NON '); 
        } else {
          console.log('Message to send:', messageToSend);
          this.PLAYERINFO.sendMessage(messageToSend);
          this.PLAYERINFO.messageInput = '';
        }
      } else {
        console.error('Player pseudo is not defined');
      }
    }
  }
  @ViewChild('chatList') chatList!: ElementRef;

  private scrollToBottom(): void {
    try {
      this.chatList.nativeElement.scrollTop = this.chatList.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling chat list to bottom:', err);
    }
  }
 ngAfterViewChecked() {
    this.scrollToBottom();
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
}
