import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
// Interface que bate com o seu modal
export interface NovoChamado {
  numeroProtocolo?: string;
  cliente: string;
  area: string;
  assunto: string;
  atendente: string;
  prioridade: string;
  status: string;
  descricao: string;
  data: string;
  hora: string;
  dataHoraCriacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChamadosService {
  // Rota da sua API Node.js
// NOVO SERVICE (ex: area.service.ts)
private readonly API_URL = `${environment.apiUrl}/atendimentos`; 
// ...
  constructor(private http: HttpClient) {}

  criarChamado(chamado: NovoChamado): Observable<any> {
    // 1. Gerar Protocolo se não vier preenchido (Ex: DATA + Randon)
    const protocolo = chamado.numeroProtocolo || `ATD-${Date.now()}`;

    // 2. Converter os nomes dos campos para o que o BACKEND espera (Atendimento.js)
    const payloadBackend = {
      numeroProtocolo: protocolo,
      tipoCliente: chamado.cliente,           // Front: cliente -> Back: tipoCliente
      categoriaAssunto: chamado.area,         // Front: area -> Back: categoriaAssunto
      hora: chamado.hora,
      descricaoDetalhada: chamado.descricao,  // Front: descricao -> Back: descricaoDetalhada
      nivelPrioridade: chamado.prioridade,    // Front: prioridade -> Back: nivelPrioridade
      avanco: 'aberto'                        // Padrão
    };

    // 3. Enviar para a API
    return this.http.post(this.API_URL, payloadBackend, { withCredentials: true });
  }

  // Método para listar (já convertendo para o formato da tela, se precisar)
  getChamados(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true });
  }
}