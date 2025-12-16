import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface UsuarioLogado {
  id?: string;
  email: string;
  nome: string;
  perfil: string;
  token?: string;
  areas: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // CORREÇÃO ESSENCIAL: Separar as rotas para não misturar /atendimentos com /usuarios
  private readonly API_USUARIOS = `${environment.apiUrl}/usuarios`;

  private usuarioLogadoSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  public usuarioLogado$ = this.usuarioLogadoSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.verificarUsuarioLogado();
  }

  // --- LOGIN ---
  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    const payload = { email, senha: password };

    // CORREÇÃO: Usando a rota de USUARIOS e enviando credenciais
    return this.http.post<any>(`${this.API_USUARIOS}/login`, payload, { withCredentials: true }).pipe(
      tap(response => {
        const usuarioBack = response.usuario;

        const usuarioFormatado: UsuarioLogado = {
          id: usuarioBack.id,
          email: usuarioBack.email,
          nome: usuarioBack.nomeCompleto,
          perfil: usuarioBack.perfilAcesso,
          token: response.token,
          areas: usuarioBack.areas || []
        };

        this.definirSessao(usuarioFormatado, rememberMe);
      })
    );
  }

  // --- DELETE USUÁRIO ---
  deletarUsuario(id: string): Observable<any> {
    // CORREÇÃO: Enviando credenciais
    return this.http.delete(`${this.API_USUARIOS}/${id}`, { withCredentials: true });
  }

  // --- LOGOUT ---
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      // CORREÇÃO: Usando a rota de USUARIOS e enviando credenciais
      this.http.post(`${this.API_USUARIOS}/logout`, {}, { withCredentials: true }).subscribe();
      this.limparSessaoLocal();
    }
    this.router.navigate(['/login']);
  }

  // --- GET USUÁRIOS ---
  getTodosUsuarios(): Observable<any[]> {
    // CORREÇÃO: Usando a rota de USUARIOS e ENVIANDO AS CREDENCIAIS (Essencial para o 401!)
    return this.http.get<any[]>(this.API_USUARIOS, { withCredentials: true }).pipe(
      map(listaDoBackend => {
        return listaDoBackend.map(u => ({
          id: u._id,
          nome: u.nomeCompleto,
          email: u.email,
          perfil: u.perfilAcesso
        }));
      })
    );
  }

  // --- CRIAR USUÁRIO ---
  criarUsuario(dados: any): Observable<any> {
    const payload = {
      nomeCompleto: dados.nome,
      email: dados.email,
      senha: dados.password,
      perfilAcesso: dados.perfil
    };
    // CORREÇÃO: Usando a rota de USUARIOS
    return this.http.post(`${this.API_USUARIOS}/register`, payload);
  }

  recuperarSenha(email: string): Observable<any> {
    return throwError(() => new Error('Funcionalidade de recuperação de senha ainda não implementada no servidor.'));
  }

  // =========================================================================
  // MÉTODOS AUXILIARES (Sem alterações)
  // =========================================================================

  private definirSessao(usuario: UsuarioLogado, rememberMe: boolean): void {
    this.usuarioLogadoSubject.next(usuario);
    if (isPlatformBrowser(this.platformId)) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('usuario', JSON.stringify(usuario));
    }
  }

  private limparSessaoLocal(): void {
    this.usuarioLogadoSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuario');
      sessionStorage.removeItem('usuario');
    }
  }

  private verificarUsuarioLogado(): void {
    if (isPlatformBrowser(this.platformId)) {
      const uL = localStorage.getItem('usuario');
      const uS = sessionStorage.getItem('usuario');

      if (uL) {
        this.usuarioLogadoSubject.next(JSON.parse(uL));
      } else if (uS) {
        this.usuarioLogadoSubject.next(JSON.parse(uS));
      }
    }
  }

  isLogado(): boolean {
    return this.usuarioLogadoSubject.value !== null;
  }

  getUsuarioLogado(): UsuarioLogado | null {
    return this.usuarioLogadoSubject.value;
  }

  isSupervisor(): boolean {
    return this.getUsuarioLogado()?.perfil === 'supervisor';
  }

  isAtendente(): boolean {
    const p = this.getUsuarioLogado()?.perfil;
    return !!p && p !== 'supervisor';
  }

  canAccessAtendenteRoute(): boolean {
    return this.isLogado();
  }

  canAccessSupervisorRoute(): boolean {
    return this.isLogado() && this.isSupervisor();
  }

  getAreaDoUsuario(): string {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return '';
    if (usuario.perfil === 'supervisor' || usuario.perfil === 'atendente') {
        return usuario.areas && usuario.areas.length > 0 ? usuario.areas[0] : '';
    }
    return usuario.perfil;
  }

  podeGerenciarChamados(): boolean {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return false;
    return usuario.perfil === 'supervisor' || usuario.perfil === 'atendente';
  }
}