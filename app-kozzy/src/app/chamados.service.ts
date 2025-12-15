import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment'; // O VS Code deve ajudar a completar

// ...

// Interfaces
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
  origem?: 'whatsapp' | 'email'; // Novo campo
}

export interface Chamado {
  id: string;
  numeroProtocolo: string;
  cliente: string;
  area: string;
  categoria: string;
  atendente: string;
  prioridade: string;
  status: string;
  descricao: string;
  dataAbertura: string;
  horaAbertura: string;
  icone?: string;
  isNovo?: boolean;
  origem?: 'whatsapp' | 'email'; // Novo campo
}

export interface RelatorioFilters {
  status: string;
  dataInicio: string;
  dataFim: string;
  prioridade: string;
  atendente: string;
  cliente?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChamadosService {
private readonly API_URL = `${environment.apiUrl}/atendimentos`; 
 
  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 1. GET (Listar)
  getChamados(): Observable<Chamado[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true }).pipe(
      map(listaDoBackend => {
        return listaDoBackend.map(item => {
          
          let iconeVisual = '📄';
          const area = (item.categoriaAssunto || '').toString();
          
          if (area.includes('Financeiro')) iconeVisual = '💰';
          else if (area.includes('Logistica') || area.includes('Entrega')) iconeVisual = '📦';
          else if (area.includes('Técnico') || area.includes('T.I')) iconeVisual = '🔧';
          else if (area.includes('Comercial') || area.includes('Vendas')) iconeVisual = '📞';
          else if (area.includes('RH')) iconeVisual = '👥';

          // Nome do atendente
          let nomeAtendente = 'Sistema';
          if (item.criadoPor && typeof item.criadoPor === 'object' && item.criadoPor.nomeCompleto) {
             nomeAtendente = item.criadoPor.nomeCompleto;
          } else if (item.criadoPor && typeof item.criadoPor === 'string') {
             nomeAtendente = 'ID: ' + item.criadoPor.substring(0, 5) + '...';
          }
          
          return {
            id: item._id,
            numeroProtocolo: item.numeroProtocolo,
            cliente: item.tipoCliente,
            area: item.categoriaAssunto,
            categoria: item.assuntoEspecifico || item.categoriaAssunto || '', 
            
            // --- MAPEAMENTO DA ORIGEM ---
            origem: item.origem || 'email',

            atendente: nomeAtendente,
            prioridade: item.nivelPrioridade,
            status: item.avanco,
            descricao: item.descricaoDetalhada,
            dataAbertura: item.dataAtendimento ? item.dataAtendimento.split('T')[0] : '',
            horaAbertura: item.hora,
            icone: iconeVisual,
            isNovo: false
          } as Chamado;
        });
      }),
      tap(chamados => this.chamadosSubject.next(chamados))
    );
  }

  // 2. POST
  adicionarChamado(chamado: NovoChamado): Observable<any> {
    const payload = {
      numeroProtocolo: chamado.numeroProtocolo,
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.assunto,
      hora: chamado.hora,
      dataAtendimento: chamado.data,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      avanco: 'aberto',
      origem: chamado.origem // Envia origem
    };
    return this.http.post(this.API_URL, payload, { withCredentials: true });
  }

  // 3. PUT
  atualizarChamado(chamado: Chamado): Observable<any> {
    const payload = {
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.categoria,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      avanco: chamado.status
    };
    const url = `${this.API_URL}/${chamado.id}`;
    return this.http.put(url, payload, { withCredentials: true });
  }

  // --- 4. DELETE (NOVO) ---
  deletarChamado(id: string): Observable<any> {
    const url = `${this.API_URL}/${id}`;
    return this.http.delete(url, { withCredentials: true });
  }

  // Métodos Auxiliares
  buscarPorProtocolo(protocolo: string): Chamado | undefined {
    return this.chamadosSubject.value.find(c => c.numeroProtocolo === protocolo);
  }

  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
    return this.chamadosSubject.value; 
  }
}