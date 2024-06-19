import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bet } from '../table/table.component';
import { WebSocketService } from '../web-socket.service';

@Component({
  selector: 'app-playout',
  templateUrl: './playout.component.html',
  styleUrls: ['./playout.component.css']
})
export class PlayoutComponent implements OnInit {
  
  playerInfo: any;
  pageCharger: number = 1;
  pedro: boolean = false;
  oldCredit: number | undefined;
  tableauparie: Bet[] | undefined;
  private reloaderSubject: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  public reloader$: Observable<number> = this.reloaderSubject.asObservable();
  private etatPartieSubject: BehaviorSubject<number | undefined> = new BehaviorSubject<number | undefined>(undefined);
  public etatPartie$: Observable<number | undefined> = this.etatPartieSubject.asObservable();
  subscription: any;
  chatSubscription: any;
  joueurConnecter: boolean = false; 

  randomNumber: number | undefined;
  salonNumber: number | undefined;
  etatPartie: number | undefined;

  chatMessages: string[] = [];

  tchatOpen : boolean = true;
  
  constructor(private webSocketService: WebSocketService) {}

  updateReloader(num: number): void {
    this.reloaderSubject.next(num);
    this.etatPartieSubject.next(num);
  }

   ngOnInit() {
    this.subscription = this.webSocketService.connect().subscribe((data: any) => {
      console.log('WebSocket message received:', data);
      this.randomNumber = data.NbAlea;
      this.salonNumber = data.salonId;
      this.etatPartie = data.etatPartie;
      this.etatPartieSubject.next(data.etatPartie);
    });

    this.chatSubscription = this.webSocketService.connectChat().subscribe((message: string) => {
      console.log('Chat message received:', message);
      this.chatMessages.push(message);
    });

    
  }

  sendMessage(message: string) {
    this.webSocketService.sendMessage(message);
  }

  sendTotoMessage() {
    this.sendMessage('toto');
  }


  displayChatMessages() {
    console.log('Current chat messages:', this.chatMessages);
  }

  
  messageInput: string = '';
}
