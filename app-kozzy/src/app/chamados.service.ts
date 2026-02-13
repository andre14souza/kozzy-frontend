import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces
export interface NovoChamado {
  numeroProtocolo?: string;
  cliente: string;
  area: string;
  assunto: string;
  atendente: any; // CORREÇÃO: Alterado para any para aceitar ID ou Objeto
  prioridade: string;
  status: string;
  descricao: string;
  data: string;
  hora: string;
  dataHoraCriacao: string;
  origem?: 'whatsapp' | 'email';
}

export interface Chamado {
  id: string;
  numeroProtocolo: string;
  cliente: string;
  area: string;
  categoria: string;
  atendente?: any; // CORREÇÃO: Alterado para any para evitar erro de build (NG9)
  prioridade: string;
  status: string;
  descricao: string;
  dataAbertura: string;
  horaAbertura: string;
  icone?: string;
  isNovo?: boolean;
  origem?: 'whatsapp' | 'email';
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

          return {
            id: item._id,
            numeroProtocolo: item.numeroProtocolo,
            cliente: item.tipoCliente,
            area: item.categoriaAssunto,
            categoria: item.assuntoEspecifico || item.categoriaAssunto || '', 
            origem: item.origem || 'email',

            // CORREÇÃO: Mantemos o objeto completo do atendente vindo do populate
            atendente: item.atendente, 
            
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

  // 2. POST (Criar)
  adicionarChamado(chamado: NovoChamado): Observable<any> {
    // Garante que enviamos apenas o ID, não o objeto
    const idAtendente = (chamado.atendente && typeof chamado.atendente === 'object') 
      ? chamado.atendente._id 
      : chamado.atendente;

    const payload = {
      numeroProtocolo: chamado.numeroProtocolo,
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.assunto,
      hora: chamado.hora,
      dataAtendimento: chamado.data,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      atendente: idAtendente || null, // ✅ Apenas ID ou null
      avanco: 'aberto',
      origem: chamado.origem
    };
    return this.http.post(this.API_URL, payload, { withCredentials: true });
  }

  // 3. PUT (Atualização)
  atualizarChamado(chamado: Chamado): Observable<any> {
    const idAtendente = (chamado.atendente && typeof chamado.atendente === 'object') 
      ? chamado.atendente._id 
      : chamado.atendente;

    const payload = {
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.categoria,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      atendente: idAtendente || null, // ✅ Apenas ID ou null
      avanco: chamado.status
    };
    const url = `${this.API_URL}/${chamado.id}`;
    return this.http.put(url, payload, { withCredentials: true });
  }

  // 4. DELETE
  deletarChamado(id: string): Observable<any> {
    const url = `${this.API_URL}/${id}`;
    return this.http.delete(url, { withCredentials: true });
  }

  buscarPorProtocolo(protocolo: string): Chamado | undefined {
    return this.chamadosSubject.value.find(c => c.numeroProtocolo === protocolo);
  }

  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
    return this.chamadosSubject.value; 
  }
}