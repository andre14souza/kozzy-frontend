import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly SERVER_URL = environment.apiUrl.replace(/\/api$/, '');

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('[Socket.io] Conectado ao servidor:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Desconectado:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Erro de conexão (modo offline):', err.message);
    });
  }

  /**
   * Entra na sala pessoal do usuário para receber notificações privadas.
   */
  joinUserRoom(userId: string): void {
    if (!userId) return;
    this.socket?.emit('join:user', userId);
  }

  /**
   * Escuta um evento e retorna um Observable que emite os dados recebidos.
   */
  on<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket?.on(event, (data: T) => observer.next(data));
    });
  }

  /**
   * Emite um evento para o servidor.
   */
  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
