import { Component, ElementRef, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { PlayoutComponent } from '../playout/playout.component';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { WebSocketService } from '../web-socket.service'; // Importez le service WebSocket

export interface Bet {
  betType: string;
  amount: number;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
}) 

export class TableComponent implements OnInit  {
  totalTime: number = 30; // Temps total en secondes
  currentTime: number = this.totalTime;
  interval: any; 
  selectedToken: { value: number, color: string } | null = null;
  cellTokens: { [key: string]: { count: number, color: string, originalContent: string, originalColor: string } } = {};
  credit: number = 100; //INITIALISATION CREDIT
  actionHistory: { cellId: string, previousCount: number, previousColor: string, tokenValue: number }[] = [];
  previousSelectedTokenElement: HTMLElement | null = null;
  isCreditBlurred: boolean = false; 
  openReloadCredit: boolean = false;
 
  private allServerURL = 'http://localhost:8000/player/update';
 
  subscription: any;
oldCredit : number | undefined;
  isBonusActive: boolean = false; // Ajout de la variable pour l'état du bouton
  lastBet: { [key: string]: { count: number, color: string } } | null = null;
  
  constructor(public PLAYERINFO: PlayoutComponent, private elRef: ElementRef, private httpClient: HttpClient, private router: Router, private webSocketService: WebSocketService) {
 
  
 
    this.PLAYERINFO.pageCharger = 0;
    if (this.PLAYERINFO.playerInfo && typeof this.PLAYERINFO.playerInfo.credit === 'number') {
      this.credit = this.PLAYERINFO.playerInfo.credit;
    }
    if(this.credit <= 0){
      this.openModal();
    }
  }

  ngOnInit() {
    
    //if(!this.PLAYERINFO.joueurConnecter){this.router.navigate(['/login']);}
    
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
  startCountdown() {
    this.interval = setInterval(() => {
      if (this.currentTime > 0) {
        this.currentTime--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  get progress() {
    return (this.currentTime / this.totalTime) * 100;
  }


  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  redirectToLogin() {
    // Vérifier si le joueur est connecté
    if (!this.PLAYERINFO.playerInfo || !this.PLAYERINFO.playerInfo.pseudo) {
      // Rediriger vers le composant de connexion
      this.router.navigate(['/login']);
    } else {
      // Rediriger vers la page de la roulette
      this.router.navigate(['/roulette']);
    }
  }
  creditOp(value: number) {
    this.credit += value;
  }

  onTokenClick(value: number, color: string) {
    if (value === 99) { // Check if the clicked token is MAX
      if (this.credit > 0) {
        value = this.credit; // Use all remaining credits
      } else {
        alert("Crédit insuffisant pour placer ce pari !");
        return;
      }
    }
    this.selectedToken = { value, color };
    console.log(`Selected token: ${value} of color ${color}`);

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

  onCellClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.selectedToken && target.tagName === 'TD' && target.id) {
      const cellId = target.id;
  
      // Vérifiez si le crédit est suffisant pour placer le jeton
      if (this.credit < this.selectedToken.value) {
        alert("Crédit insuffisant pour placer ce pari !");
        return;
      }
  
      if (!this.cellTokens[cellId]) {
        this.cellTokens[cellId] = { 
          count: 0, 
          color: this.selectedToken.color, 
          originalContent: target.innerText,
          originalColor: target.style.backgroundColor || '' 
        };
      }
      
      // Save current state for undo functionality
      this.actionHistory.push({ 
        cellId, 
        previousCount: this.cellTokens[cellId].count, 
        previousColor: this.cellTokens[cellId].color,
        tokenValue: this.selectedToken.value 
      });
      
      // Update the cell data with the selected token value
      this.cellTokens[cellId].count += this.selectedToken.value;
      this.cellTokens[cellId].color = this.selectedToken.color;
      this.creditOp(-this.selectedToken.value);

      // Update the display of the cell
      this.updateCellDisplay(cellId);
      this.logTokensData();
   // Save the current bet as the last bet
    }
  } 
 

  onReplayLastBet() {
    alert("Option indisponible pour le moment.");
    /*if (this.lastBet) {
      Object.keys(this.lastBet).forEach(cellId => {
        const cellData = this.lastBet![cellId];
        if (this.credit >= cellData.count) {
          if (!this.cellTokens[cellId]) {
            this.cellTokens[cellId] = { 
              count: 0, 
              color: cellData.color, 
              originalContent: '', 
              originalColor: '' 
            };
          }

          // Save current state for undo functionality
          this.actionHistory.push({ 
            cellId, 
            previousCount: this.cellTokens[cellId].count, 
            previousColor: this.cellTokens[cellId].color,
            tokenValue: cellData.count 
          });

          // Update the cell data with the last bet value
          this.cellTokens[cellId].count += cellData.count;
          this.cellTokens[cellId].color = cellData.color;
          this.creditOp(-cellData.count);

          // Update the display of the cell
          this.updateCellDisplay(cellId);
        } else {
          alert("Crédit insuffisant pour rejouer le pari précédent !");
        }
      });
      this.logTokensData();
    } else {
      alert("Aucun pari précédent à rejouer !");
    }*/
  }



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

  getCellCount(cellId: string): number {
    return this.cellTokens[cellId]?.count;
  }


  getPedro(){
    this.PLAYERINFO.pedro=!this.PLAYERINFO.pedro;
    console.log("pedro");
    console.log(this.PLAYERINFO.pedro);
  }

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
  
  toggleBonus() {
    this.isBonusActive = !this.isBonusActive;
    this.logTokensData(); // Log the bets including the bonus bet when toggled
  }

  toggleCreditBlur() {
    this.isCreditBlurred = !this.isCreditBlurred;
  } 

  openModal(){
    this.openReloadCredit=true;
  }
  closeModal(){
    this.openReloadCredit=false;
  }

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

 

  openCloseTchat(){
    this.PLAYERINFO.tchatOpen = !this.PLAYERINFO.tchatOpen;
     
  }
}
