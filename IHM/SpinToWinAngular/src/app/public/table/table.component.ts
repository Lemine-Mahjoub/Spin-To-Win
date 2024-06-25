import { Component, ElementRef, OnInit, SimpleChanges, ViewChild, Renderer2 } from '@angular/core';
import { PlayoutComponent } from '../playout/playout.component';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { WebSocketService } from '../web-socket.service'; // Importez le service WebSocket

// Interface définissant la structure d'un pari
export interface Bet {
  betType: string; // Type de pari
  amount: number; // Montant du pari
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
}) 

export class TableComponent implements OnInit {
  totalTime: number = 30; // Temps total en secondes pour le compte à rebours
  currentTime: number = this.totalTime; // Temps actuel du compte à rebours
  interval: any; // Intervalle pour le compte à rebours
  selectedToken: { value: number, color: string } | null = null; // Jeton sélectionné
  cellTokens: { [key: string]: { count: number, color: string, originalContent: string, originalColor: string } } = {}; // Jetons placés sur la table
  credit: number = 100; // Crédit initial du joueur
  actionHistory: { cellId: string, previousCount: number, previousColor: string, tokenValue: number }[] = []; // Historique des actions pour annuler
  previousSelectedTokenElement: HTMLElement | null = null; // Élément du jeton précédemment sélectionné
  isCreditBlurred: boolean = false; // État pour flouter le crédit
  openReloadCredit: boolean = false; // État pour afficher le modal de rechargement de crédit
  private allServerURL = 'http://valentin:8000/player/update'; // URL du serveur pour mettre à jour le crédit
  subscription: any; // Subscription pour l'état de la partie
  oldCredit : number | undefined; // Ancien crédit du joueur
  isBonusActive: boolean = false; // État pour le bouton bonus
  lastBet: { [key: string]: { count: number, color: string } } | null = null; // Dernier pari

  constructor(
    public PLAYERINFO: PlayoutComponent,
    private elRef: ElementRef,
    private httpClient: HttpClient,
    private router: Router,
    private webSocketService: WebSocketService,
    private renderer: Renderer2
  ) {
    // Initialisation de la page
    this.PLAYERINFO.pageCharger = 0;
    if(!this.PLAYERINFO.joueurConnecter){this.router.navigate(['/login']);}
    if (this.PLAYERINFO.playerInfo && typeof this.PLAYERINFO.playerInfo.credit === 'number') {
      this.credit = this.PLAYERINFO.playerInfo.credit;
    }
    if (this.credit <= 0) {
      this.openModal();
    }
  }

  ngOnInit() {
    // Initialisation de la barre de progression
    const progressBar = this.elRef.nativeElement.querySelector('.progress');
    console.log('ProgressBar Element:', progressBar);
    if (progressBar) {
      setTimeout(() => {
        console.log('Setting width to 100%');
        this.renderer.setStyle(progressBar, 'width', '100%');
      }, 100);
    }

    // Vérifiez si vous êtes actuellement sur la page de la table
    if (this.router.url === '/table') {
      // Abonnez-vous uniquement aux changements de l'état de partie si vous êtes sur la page de la table
      this.subscription = this.PLAYERINFO.etatPartie$.subscribe((num: number | undefined) => {
        if (num === 2) {
          // Redirigez vers le composant '/roulette' si l'état de partie est 2
          this.router.navigate(['/roulette']);
        }
      });
    }

    if (this.PLAYERINFO.playerInfo && typeof this.PLAYERINFO.playerInfo.credit === 'number') {
      this.credit = this.PLAYERINFO.playerInfo.credit;
    }
    if (this.credit <= 0) {
      this.openModal();
    }
  }

  // Démarrer le compte à rebours
  startCountdown() {
    this.interval = setInterval(() => {
      if (this.currentTime > 0) {
        this.currentTime--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  // Obtenir la progression en pourcentage
  get progress() {
    return (this.currentTime / this.totalTime) * 100;
  }

  // Désabonnement à la destruction du composant
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Redirection vers la page de connexion si le joueur n'est pas connecté
  redirectToLogin() {
    if (!this.PLAYERINFO.playerInfo || !this.PLAYERINFO.playerInfo.pseudo) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/roulette']);
    }
  }

  // Opération sur le crédit du joueur
  creditOp(value: number) {
    this.credit += value;
  }

  // Gestion de la sélection d'un jeton
  onTokenClick(value: number, color: string) {
    if (value === 99) { // Vérifiez si le jeton sélectionné est le jeton MAX
      if (this.credit > 0) {
        value = this.credit; // Utilisez tous les crédits restants
      } else {
        alert("Crédit insuffisant pour placer ce pari !");
        return;
      }
    }
    this.selectedToken = { value, color };
    console.log(`Selected token: ${value} of color ${color}`);

    // Gestion de la sélection visuelle du jeton
    if (this.previousSelectedTokenElement) {
      this.previousSelectedTokenElement.classList.remove('selected');
    }

    const tokenElements = this.elRef.nativeElement.querySelectorAll('.token');
    tokenElements.forEach((tokenElement: HTMLElement) => {
      if (parseInt(tokenElement.querySelector('text')?.textContent || '0', 10) === value || (value === this.credit && tokenElement.querySelector('text')?.textContent === 'MAX')) {
        tokenElement.classList.add('selected');
        this.previousSelectedTokenElement = tokenElement;
      }
    });
  }

  // Gestion du clic sur une cellule de la table
  onCellClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.selectedToken && target.tagName === 'TD' && target.id) {
      const cellId = target.id;

      // Vérifiez si le crédit est suffisant pour placer le jeton
      if (this.credit < this.selectedToken.value) {
        alert("Crédit insuffisant pour placer ce pari !");
        return;
      }

      // Initialisation de la cellule si elle n'existe pas encore
      if (!this.cellTokens[cellId]) {
        this.cellTokens[cellId] = { 
          count: 0, 
          color: this.selectedToken.color, 
          originalContent: target.innerText,
          originalColor: target.style.backgroundColor || '' 
        };
      }

      // Sauvegarder l'état actuel pour la fonctionnalité d'annulation
      this.actionHistory.push({ 
        cellId, 
        previousCount: this.cellTokens[cellId].count, 
        previousColor: this.cellTokens[cellId].color,
        tokenValue: this.selectedToken.value 
      });

      // Mettre à jour les données de la cellule avec la valeur du jeton sélectionné
      this.cellTokens[cellId].count += this.selectedToken.value;
      this.cellTokens[cellId].color = this.selectedToken.color;
      this.creditOp(-this.selectedToken.value);

      // Mettre à jour l'affichage de la cellule
      this.updateCellDisplay(cellId);
      this.logTokensData();
    }
  }

  // Mise à jour de l'affichage de la cellule
  updateCellDisplay(cellId: string) {
    const cell = document.getElementById(cellId);
    if (cell) {
      const cellData = this.cellTokens[cellId];
      cell.innerHTML = '';

      if (cellData.count > 0 && this.selectedToken) {
        const tokenColor = this.getTokenColor(cellData.count);
        const tokenSvg = this.createTokenSvg(cellData.count, tokenColor);
        tokenSvg.classList.add('token-svg');
        cell.appendChild(tokenSvg);
      } else {
        cell.innerText = cellData.originalContent;
        cell.style.backgroundColor = cellData.originalColor;
      }
    }
  }

  // Obtention de la couleur du jeton en fonction du montant
  getTokenColor(count: number): string {
    if (count >= 1 && count <= 4) {
      return 'yellow';
    } else if (count >= 5 && count <= 9) {
      return 'orange';
    } else if (count >= 10 && count <= 19) {
      return 'red';
    } else if (count >= 20 && count <= 49) {
      return 'purple';
    } else {
      return 'lightblue';
    }
  }

  // Création du SVG du jeton
  createTokenSvg(value: number, color: string): SVGSVGElement {
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNamespace, 'svg') as SVGSVGElement;
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'token');
    svg.setAttribute('width', '50');
    svg.setAttribute('height', '50');

    const circle = document.createElementNS(svgNamespace, 'circle') as SVGCircleElement;
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '45');
    circle.setAttribute('class', 'outer-circle');
    circle.setAttribute('fill', 'black');

    const innerCircle = document.createElementNS(svgNamespace, 'circle') as SVGCircleElement;
    innerCircle.setAttribute('cx', '50');
    innerCircle.setAttribute('cy', '50');
    innerCircle.setAttribute('r', '30');
    innerCircle.setAttribute('fill', color);

    const text = document.createElementNS(svgNamespace, 'text') as SVGTextElement;
    text.setAttribute('x', '50');
    text.setAttribute('y', '60');
    text.setAttribute('font-size', '150%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'chip-number');
    text.setAttribute('fill', 'black');
    text.textContent = `${value}`;

    const segmentsGroup = document.createElementNS(svgNamespace, 'g') as SVGGElement;
    segmentsGroup.setAttribute('class', 'segments6');

    const createSegment = (rotation: number) => {
      const rect = document.createElementNS(svgNamespace, 'rect') as SVGRectElement;
      rect.setAttribute('x', '47');
      rect.setAttribute('y', '5');
      rect.setAttribute('width', '6');
      rect.setAttribute('height', '10');
      rect.setAttribute('transform', `rotate(${rotation} 50 50)`);
      rect.setAttribute('fill', color);
      return rect;
    };

    for (let i = 0; i < 360; i += 45) {
      const rect = createSegment(i);
      segmentsGroup.appendChild(rect);
    }

    svg.appendChild(circle);
    svg.appendChild(innerCircle);
    svg.appendChild(segmentsGroup);
    svg.appendChild(text);

    return svg;
  }

  // Obtenir le nombre de jetons dans une cellule
  getCellCount(cellId: string): number {
    return this.cellTokens[cellId]?.count;
  }

  // Gestion de l'affichage de Pedro
  getPedro() {
    this.PLAYERINFO.pedro = !this.PLAYERINFO.pedro;
    this.PLAYERINFO.fede = false;
    
  }
  getFede() {
    this.PLAYERINFO.fede = !this.PLAYERINFO.fede;
    this.PLAYERINFO.pedro = false;
     
  }
  // Suppression de tous les jetons
  onRemoveAllTokens() {
    Object.keys(this.cellTokens).forEach(cellId => {
      const cellData = this.cellTokens[cellId];
      this.creditOp(cellData.count);
      cellData.count = 0;
      const cell = document.getElementById(cellId);
      if (cell) {
        cell.style.backgroundColor = cellData.originalColor;
        cell.innerText = cellData.originalContent;
      }
    });
    this.cellTokens = {};
    this.actionHistory = [];
    this.logTokensData();
  }

  // Annulation de la dernière action
  onUndoLastAction() {
    console.log("toto")
    const lastAction = this.actionHistory.pop();
    if (lastAction) {
      const { cellId, previousCount, previousColor, tokenValue } = lastAction;
      const cellData = this.cellTokens[cellId];
      cellData.count = previousCount;
      cellData.color = previousColor;
      this.updateCellDisplay(cellId);
      this.creditOp(tokenValue);
      this.logTokensData();
    }
  }

  // Log des données des jetons
  logTokensData() {
    console.log("totoo")
    // Map the cellTokens to tableauparie
    this.PLAYERINFO.tableauparie = Object.entries(this.cellTokens).map(([key, value]) => {
      return {
        betType: value.originalContent,
        amount: value.count
      };
    });

    // Add bonus bet if isBonusActive is true
    if (this.isBonusActive) {
      this.PLAYERINFO.tableauparie.push({ betType: 'bonus', amount: 0 });
    }

    console.table(this.PLAYERINFO.tableauparie);
  }

  // Basculement de l'état du bonus
  toggleBonus() {
    this.isBonusActive = !this.isBonusActive;
    this.logTokensData(); // Log the bets including the bonus bet when toggled
  }

  // Basculement de l'affichage flouté du crédit
  toggleCreditBlur() {
    this.isCreditBlurred = !this.isCreditBlurred;
  } 

  // Ouverture du modal de rechargement de crédit
  openModal() {
    this.openReloadCredit = true;
  }

  // Fermeture du modal de rechargement de crédit
  closeModal() {
    this.openReloadCredit = false;
  }

  // Rechargement du crédit
  reloadCredit() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
  
    // Préparez les données avec le pseudo du joueur et le crédit mis à jour
    const data = {
      pseudo: this.PLAYERINFO.playerInfo.pseudo,
      credit: 100
    };
  
    this.httpClient.put<any>(this.allServerURL, data, { headers: headers })
      .subscribe(
        (response: { mot_de_passe_hash: any; }) => {
          console.log('PUT request successful:', response);
          delete response.mot_de_passe_hash;
  
          // Mettre à jour les informations du joueur
          this.PLAYERINFO.playerInfo = response;
          if (this.PLAYERINFO.playerInfo && typeof this.PLAYERINFO.playerInfo.credit === 'number') {
            this.credit = this.PLAYERINFO.playerInfo.credit;
          }
        },
        (error: any) => {
          console.error('PUT request error:', error);
        }
      );
  }

  // Envoi d'un message dans le chat
  envoyerUnMessage() {
    if (this.PLAYERINFO.messageInput.trim() !== '') {
      const pseudo = this.PLAYERINFO.playerInfo?.pseudo;
      if (pseudo) {
        const messageToSend = pseudo + " | " + this.PLAYERINFO.messageInput;
        console.log('Message to send:', messageToSend);
        this.PLAYERINFO.sendMessage(messageToSend);
        this.PLAYERINFO.messageInput = '';
      } else {
        console.error('Player pseudo is not defined');
      }
    }
  }

  @ViewChild('chatList') chatList!: ElementRef;

  // Fonction pour faire défiler la liste de chat vers le bas
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

  // Ouverture/fermeture du chat
  openCloseTchat() {
    this.PLAYERINFO.tchatOpen = !this.PLAYERINFO.tchatOpen;
  }
}
