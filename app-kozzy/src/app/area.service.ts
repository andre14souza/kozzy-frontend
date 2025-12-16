// ABRIR: area.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'; // Garante o caminho correto

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  // 💥 CORREÇÃO: Usar a variável de ambiente para a URL
  private readonly API_URL = `${environment.apiUrl}/areas`; 

  constructor(private http: HttpClient) {}
  
  // Se esta função for usada para buscar a área que estava no erro de localhost:
  getAreaById(id: string): Observable<any> {
    // Adicione withCredentials para que o Interceptor funcione
    return this.http.get(`${this.API_URL}/${id}`, { withCredentials: true });
  }
  
  // Se houver uma função que lista todas as áreas
  getTodasAreas(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true });
  }
}