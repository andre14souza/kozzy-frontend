import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, UsuarioLogado } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    if (this.usuarioLogado) {
      this.formData.nome = this.usuarioLogado.nome;
      this.formData.email = this.usuarioLogado.email;
    }
  }

  salvarPerfil() {
    if (this.formData.novaSenha && this.formData.novaSenha !== this.formData.confirmarSenha) {
      this.mostrarMensagem('As senhas não coincidem.', true);
      return;
    }

    const payload = {
      nome: this.formData.nome,
      email: this.formData.email,
      senhaAntiga: this.formData.senhaAntiga,
      novaSenha: this.formData.novaSenha
    };

    // Chamada pro backend usando API de perfil
    this.http.put(`${environment.apiUrl}/usuarios/perfil`, payload, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.mostrarMensagem('Perfil atualizado com sucesso!', false);
        this.formData.senhaAntiga = '';
        this.formData.novaSenha = '';
        this.formData.confirmarSenha = '';
        
        // Atualiza localStorage se necessário
        if (this.usuarioLogado) {
           this.usuarioLogado.nome = this.formData.nome;
           this.usuarioLogado.email = this.formData.email;
           localStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
        }
      },
      error: (err) => {
        this.mostrarMensagem(err.error?.mensagem || 'Erro ao atualizar perfil.', true);
      }
    });
  }

  mostrarMensagem(msg: string, isError: boolean) {
    this.message = msg;
    this.isError = isError;
    setTimeout(() => { this.message = ''; }, 3000);
  }
}
