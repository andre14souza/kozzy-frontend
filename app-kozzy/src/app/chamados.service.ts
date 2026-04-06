import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces
export function getSLADetails(dataLimiteISO: string | undefined, statusAtual: string): { label: string, cssClass: string } {
  if (statusAtual === 'concluido' || statusAtual === 'encerrado') {
    return { label: 'Resolvido', cssClass: 'sla-resolvido' };
  }
  if (!dataLimiteISO) {
    return { label: 'No Prazo', cssClass: 'sla-no-prazo' };
  }

  const limite = new Date(dataLimiteISO);
  const hoje = new Date();

  // Verifica se é o mesmo dia
  const isMesmoDia = 
    limite.getDate() === hoje.getDate() &&
    limite.getMonth() === hoje.getMonth() &&
    limite.getFullYear() === hoje.getFullYear();

  if (hoje.getTime() > limite.getTime()) {
    return { label: 'Atrasado', cssClass: 'sla-atrasado' };
  }

  if (isMesmoDia) {
    return { label: 'Vence Hoje', cssClass: 'sla-vence-hoje' };
  }

  return { label: 'No Prazo', cssClass: 'sla-no-prazo' };
}

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
  solucao?: string;
  dataAbertura: string;
  horaAbertura: string;
  icone?: string;
  isNovo?: boolean;
  origem?: 'whatsapp' | 'email';
  comentarios?: any[];
  dataLimite?: string;
  slaStatus?: string;
  slaClass?: string;
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
            
            // ✅ CORREÇÃO: 'area' no front recebe 'categoriaAssunto' do banco
            area: item.categoriaAssunto, 
            
            // ✅ CORREÇÃO: 'categoria' no front (que é o Assunto) recebe 'assuntoEspecifico' do banco
            categoria: item.assuntoEspecifico || '', 
            
            origem: item.origem || 'email',
            atendente: item.atendente, 
            prioridade: item.nivelPrioridade,
            status: item.avanco,
            descricao: item.descricaoDetalhada,
            solucao: item.solucao,
            dataAbertura: item.dataAtendimento ? item.dataAtendimento.split('T')[0] : '',
            horaAbertura: item.hora,
            icone: iconeVisual,
            isNovo: false,
            comentarios: item.comentarios || [],
            dataLimite: item.dataLimite,
            slaStatus: getSLADetails(item.dataLimite, item.avanco).label,
            slaClass: getSLADetails(item.dataLimite, item.avanco).cssClass
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
      ? chamado.atendente._id : chamado.atendente;

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
      solucao: chamado.solucao,
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

  adicionarComentario(id: string, mensagem: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/comentarios`, { mensagem }, { withCredentials: true });
  }
  
  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
    let lista = this.chamadosSubject.value;

    if (filtros.status && filtros.status !== 'todos') {
      lista = lista.filter(c => c.status === filtros.status);
    }
    if (filtros.prioridade && filtros.prioridade !== 'todos') {
      lista = lista.filter(c => c.prioridade === filtros.prioridade);
    }
    if (filtros.cliente && filtros.cliente !== 'todos') {
      lista = lista.filter(c => c.cliente === filtros.cliente);
    }
    // Lógica simples de data (Pode ser melhorada comparando Timestamps reais)
    if (filtros.dataInicio) {
      lista = lista.filter(c => c.dataAbertura >= filtros.dataInicio);
    }
    if (filtros.dataFim) {
      lista = lista.filter(c => c.dataAbertura <= filtros.dataFim);
    }

    return lista; 
  }
}