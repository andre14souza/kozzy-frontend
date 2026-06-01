import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UsuarioLogado } from '../auth.service';
import { environment } from '../../environments/environment';
import { ThemeService } from '../theme.service';
import { UrlAnexoPipe } from '../url-anexo.pipe';

interface MenuItem { 
  label: string; 
  icon: string; 
  route?: string; 
  action?: () => void; 
  badge?: number; 
  active?: boolean; 
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UrlAnexoPipe],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;
  
  formData = {
    nome: '',
    email: '',
    senhaAntiga: '',
    novaSenha: '',
    confirmarSenha: ''
  };

  message = '';
  isError = false;
  isDarkMode = false;
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  menuCollapsed = false;
  isMobileMenuOpen = false;
  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService, 
    private http: HttpClient,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.usuarioLogado$.subscribe(user => {
      this.usuarioLogado = user;
      if (user) {
        this.formData.nome = user.nome;
        this.formData.email = user.email;
      }
    });
    this.isDarkMode = this.themeService.isDarkTheme();

    this.menuItems = [
      { label: 'Chamados', icon: '📞', route: '/central' },
      { label: 'Novo Atendimento', icon: '➕', route: '/central' },
      { label: 'Chamados do Dia', icon: '📅', route: '/hoje' },
      { label: 'Buscar Protocolo', icon: '🔍', route: '/central' },
      { label: 'Relatórios', icon: '📊', route: '/central' },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes', active: true },
      { label: 'Design System', icon: '🎨', route: '/design-system' }
    ];

    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.menuCollapsed = true;
    } else {
      this.isMobileMenuOpen = false;
    }
  }

  toggleMenu() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.menuCollapsed = !this.menuCollapsed;
    }
  }

  logout() {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDarkTheme();
    
    // Envia a preferência de tema ao backend silenciosamente
    const payload = {
      preferenciaTema: this.isDarkMode ? 'dark' : 'light'
    };
    this.http.put(`${environment.apiUrl}/usuarios/perfil`, payload, { withCredentials: true }).subscribe();
  }

  onFileSelected(event: any) {
    const arquivoSelecionado = event.target.files[0];
    if (arquivoSelecionado) {
      this.selectedFile = arquivoSelecionado;
      this.previewUrl = URL.createObjectURL(arquivoSelecionado);

      const formData = new FormData();
      formData.append('foto', arquivoSelecionado);

      this.authService.uploadFotoPerfil(formData).subscribe({
        next: (res: any) => {
          this.mostrarMensagem('Foto de perfil atualizada com sucesso!', false);
          if (res && res.usuario) {
            const fotoUrl = res.usuario.fotoPerfil;
            if (this.usuarioLogado) {
              this.usuarioLogado.foto = fotoUrl;
            }
            this.previewUrl = null;
          }
        },
        error: (err) => {
          this.mostrarMensagem(err.error?.mensagem || 'Erro ao enviar foto de perfil.', true);
        }
      });
    }
  }

  salvarPerfil() {
    if (this.formData.novaSenha && this.formData.novaSenha !== this.formData.confirmarSenha) {
      this.mostrarMensagem('As senhas não coincidem.', true);
      return;
    }

    if (this.formData.novaSenha && !this.formData.senhaAntiga) {
      this.mostrarMensagem('Digite a senha atual para alterá-la.', true);
      return;
    }

    const formData = new FormData();
    formData.append('nome', this.formData.nome);
    formData.append('email', this.formData.email);
    formData.append('preferenciaTema', this.isDarkMode ? 'dark' : 'light');

    if (this.formData.novaSenha) {
      formData.append('senha', this.formData.novaSenha);
      formData.append('senhaAntiga', this.formData.senhaAntiga);
    }

    this.authService.atualizarPerfil(formData).subscribe({
      next: (res: any) => {
        this.mostrarMensagem('Perfil atualizado com sucesso!', false);
        this.formData.senhaAntiga = '';
        this.formData.novaSenha = '';
        this.formData.confirmarSenha = '';
        this.selectedFile = null;
        this.previewUrl = null;
      },
      error: (err) => {
        this.mostrarMensagem(err.error?.mensagem || 'Erro ao atualizar perfil.', true);
      }
    });
  }

  voltar() {
    if (this.authService.isSupervisor()) {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/central']);
    }
  }

  mostrarMensagem(msg: string, isError: boolean) {
    this.message = msg;
    this.isError = isError;
    setTimeout(() => { this.message = ''; }, 3000);
  }
}
