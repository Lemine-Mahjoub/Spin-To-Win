import { Injectable } from '@angular/core';
import { Observable, Observer, EMPTY, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private gameStateSubject: Subject<any> = new Subject<any>();
  private chatSubject: Subject<any> = new Subject<any>();
  private url: string = 'ws://10.22.27.51:8888';

  constructor() {}

  connect(): Observable<any> {
    if (typeof WebSocket === 'undefined') {
      console.error('WebSocket is not supported in this environment.');
      return EMPTY;
    }

    if (!this.socket) {
      this.socket = new WebSocket(this.url);
      this.socket.onmessage = (event) => this.onMessage(event);
      this.socket.onclose = () => this.onClose();
    }

    return this.gameStateSubject.asObservable();
  }

  connectChat(): Observable<any> {
    if (typeof WebSocket === 'undefined') {
      console.error('WebSocket is not supported in this environment.');
      return EMPTY;
    }

    if (!this.socket) {
      this.socket = new WebSocket(this.url);
      this.socket.onmessage = (event) => this.onMessage(event);
      this.socket.onclose = () => this.onClose();
    }

    return this.chatSubject.asObservable();
  }

  private onMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    if (data.chatMessage) {
      this.chatSubject.next(data.chatMessage);
    } else {
      this.gameStateSubject.next(data);
    }
  }

  private onClose() {
    this.gameStateSubject.complete();
    this.chatSubject.complete();
  }

  sendMessage(message: string) {
    if (this.socket) {
      this.socket.send(JSON.stringify({ chatMessage: message }));
    }
  }
}