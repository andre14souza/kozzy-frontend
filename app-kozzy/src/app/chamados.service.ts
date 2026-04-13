import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

// ============================================================
// HELPERS
// ============================================================
export function getSLADetails(dataLimiteISO: string | undefined, statusAtual: string): { label: string, cssClass: string } {
  if (statusAtual === 'concluido' || statusAtual === 'encerrado') {
    return { label: 'Resolvido', cssClass: 'sla-resolvido' };
  }
  if (!dataLimiteISO) {
    return { label: 'No Prazo', cssClass: 'sla-no-prazo' };
  }
  const limite = new Date(dataLimiteISO);
  const hoje = new Date();
  const isMesmoDia =
    limite.getDate() === hoje.getDate() &&
    limite.getMonth() === hoje.getMonth() &&
    limite.getFullYear() === hoje.getFullYear();
  if (hoje.getTime() > limite.getTime()) return { label: 'Atrasado', cssClass: 'sla-atrasado' };
  if (isMesmoDia) return { label: 'Vence Hoje', cssClass: 'sla-vence-hoje' };
  return { label: 'No Prazo', cssClass: 'sla-no-prazo' };
}

// ============================================================
// INTERFACES
// ============================================================
export interface NovoChamado {
  numeroProtocolo?: string;
  cliente: string;
  nomeCliente?: string;
  area: string;
  assunto: string;
  atendente: any;
  prioridade: string;
  status: string;
  descricao: string;
  data: string;
  hora: string;
  dataHoraCriacao: string;
  origem?: 'whatsapp' | 'email';
  arquivo?: File;
  chamadoPai?: string;
}

export interface Chamado {
  id: string;
  numeroProtocolo: string;
  cliente: string;
  nomeCliente?: string;
  area: string;
  categoria: string;
  atendente?: any;
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
  anexo?: {
    nomeOriginal: string;
    url: string;
    caminho?: string;
  };
  chamadoPai?: string | any;
  subChamados?: Chamado[] | any[];
}

export interface RelatorioFilters {
  status: string;
  dataInicio: string;
  dataFim: string;
  prioridade: string;
  atendente: string;
  cliente?: string;
  area?: string;      // NOVO
  origem?: string;    // NOVO
}

// ============================================================
// SERVICE
// ============================================================
@Injectable({ providedIn: 'root' })
export class ChamadosService {
  private readonly API_URL = `${environment.apiUrl}/atendimentos`;

  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ---- Mapeamento centralizado (reutilizado em getChamados e buscarChamadosPorFiltros) ----
  private mapItem(item: any): Chamado {
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
      nomeCliente: item.nomeCliente,
      area: item.categoriaAssunto,
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
      slaClass: getSLADetails(item.dataLimite, item.avanco).cssClass,
      anexo: item.anexo || undefined,
      chamadoPai: item.chamadoPai,
      subChamados: item.subChamados || []
    } as Chamado;
  }

  // 1. GET (Listar todos)
  getChamados(): Observable<Chamado[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true }).pipe(
      map(lista => lista.map(item => this.mapItem(item))),
      tap(chamados => this.chamadosSubject.next(chamados))
    );
  }

  // 2. POST (Criar)
  adicionarChamado(chamado: NovoChamado): Observable<any> {
    const idAtendente = (chamado.atendente && typeof chamado.atendente === 'object')
      ? chamado.atendente._id : chamado.atendente;

    if (chamado.arquivo) {
      const formData = new FormData();
      if (chamado.numeroProtocolo) formData.append('numeroProtocolo', chamado.numeroProtocolo);
      formData.append('tipoCliente', chamado.cliente);
      if (chamado.nomeCliente) formData.append('nomeCliente', chamado.nomeCliente);
      formData.append('categoriaAssunto', chamado.area);
      formData.append('assuntoEspecifico', chamado.assunto);
      formData.append('hora', chamado.hora);
      formData.append('dataAtendimento', chamado.data);
      if (chamado.descricao) formData.append('descricaoDetalhada', chamado.descricao);
      formData.append('nivelPrioridade', chamado.prioridade);
      if (idAtendente) formData.append('atendente', idAtendente);
      formData.append('avanco', 'aberto');
      if (chamado.origem) formData.append('origem', chamado.origem);
      formData.append('anexo', chamado.arquivo);
      return this.http.post(this.API_URL, formData, { withCredentials: true });
    }

    const payload = {
      numeroProtocolo: chamado.numeroProtocolo,
      tipoCliente: chamado.cliente,
      nomeCliente: chamado.nomeCliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.assunto,
      hora: chamado.hora,
      dataAtendimento: chamado.data,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      atendente: idAtendente || null,
      avanco: 'aberto',
      origem: chamado.origem
    };
    return this.http.post(this.API_URL, payload, { withCredentials: true });
  }

  adicionarSubChamado(idChamadoPai: string, chamado: NovoChamado): Observable<any> {
    const idAtendente = (chamado.atendente && typeof chamado.atendente === 'object')
      ? chamado.atendente._id : chamado.atendente;

    if (chamado.arquivo) {
      const formData = new FormData();
      if (chamado.numeroProtocolo) formData.append('numeroProtocolo', chamado.numeroProtocolo);
      formData.append('tipoCliente', chamado.cliente);
      if (chamado.nomeCliente) formData.append('nomeCliente', chamado.nomeCliente);
      formData.append('categoriaAssunto', chamado.area);
      formData.append('assuntoEspecifico', chamado.assunto);
      formData.append('hora', chamado.hora);
      formData.append('dataAtendimento', chamado.data);
      if (chamado.descricao) formData.append('descricaoDetalhada', chamado.descricao);
      formData.append('nivelPrioridade', chamado.prioridade);
      if (idAtendente) formData.append('atendente', idAtendente);
      formData.append('avanco', 'aberto');
      if (chamado.origem) formData.append('origem', chamado.origem);
      formData.append('chamadoPai', idChamadoPai);
      formData.append('anexo', chamado.arquivo);
      return this.http.post(this.API_URL, formData, { withCredentials: true });
    }

    const payload = {
      numeroProtocolo: chamado.numeroProtocolo,
      tipoCliente: chamado.cliente,
      nomeCliente: chamado.nomeCliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.assunto,
      hora: chamado.hora,
      dataAtendimento: chamado.data,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      atendente: idAtendente || null,
      avanco: 'aberto',
      origem: chamado.origem,
      chamadoPai: idChamadoPai
    };
    return this.http.post(this.API_URL, payload, { withCredentials: true });
  }

  // 3. PUT (Atualização)
  atualizarChamado(chamado: Chamado): Observable<any> {
    const idAtendente = (chamado.atendente && typeof chamado.atendente === 'object')
      ? chamado.atendente._id : chamado.atendente;
    const payload = {
      tipoCliente: chamado.cliente,
      nomeCliente: chamado.nomeCliente,
      categoriaAssunto: chamado.area,
      assuntoEspecifico: chamado.categoria,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      solucao: chamado.solucao,
      atendente: idAtendente || null,
      avanco: chamado.status
    };
    return this.http.put(`${this.API_URL}/${chamado.id}`, payload, { withCredentials: true });
  }

  // 4. DELETE
  deletarChamado(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { withCredentials: true });
  }

  buscarPorProtocolo(protocolo: string): Chamado | undefined {
    return this.chamadosSubject.value.find(c => c.numeroProtocolo === protocolo);
  }

  adicionarComentario(id: string, mensagem: string, arquivo?: File): Observable<any> {
    if (arquivo) {
      const formData = new FormData();
      formData.append('mensagem', mensagem);
      formData.append('anexo', arquivo);
      return this.http.post(`${this.API_URL}/${id}/comentarios`, formData, { withCredentials: true });
    }
    return this.http.post(`${this.API_URL}/${id}/comentarios`, { mensagem }, { withCredentials: true });
  }

  // 5. RELATÓRIO — query params para o servidor
  buscarChamadosPorFiltros(filtros: RelatorioFilters): Observable<Chamado[]> {
    let params = new HttpParams();

    const set = (key: string, val: string | undefined) => {
      if (val && val.trim() !== '' && val !== 'todos') params = params.set(key, val);
    };

    set('avanco',           filtros.status);
    set('nivelPrioridade',  filtros.prioridade);
    set('tipoCliente',      filtros.cliente);
    set('categoriaAssunto', filtros.area);
    set('origem',           filtros.origem);
    set('atendente',        filtros.atendente);

    if (filtros.dataInicio) params = params.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim)    params = params.set('dataFim', filtros.dataFim);

    return this.http.get<any[]>(this.API_URL, { params, withCredentials: true }).pipe(
      map(lista => lista.map(item => this.mapItem(item)))
    );
  }
}