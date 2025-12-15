import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  passwordFieldType: string = 'password';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false]
    });

    // Se já estiver logado (ex: atualizou a página), redireciona automaticamente
    if (this.authService.isLogado()) {
      this.redirecionarUsuario();
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;

      // Chama o serviço de autenticação conectando com o Back-end
      this.authService.login(email, password, rememberMe).subscribe({
        next: () => {
          // SUCESSO: O usuário já foi salvo no AuthService
          const usuario = this.authService.getUsuarioLogado();
          const nome = usuario?.nome || 'Usuário';

          alert(`Bem-vindo, ${nome}! Login realizado com sucesso.`);
          
          this.redirecionarUsuario();
        },
        error: (err) => {
          // ERRO: Tratamento caso a senha esteja errada ou servidor fora
          console.error('Erro no login:', err);
          
          // Pega a mensagem que vem do seu backend (usuarioController.js)
          // Ex: "Senha incorreta." ou "Usuário não encontrado."
          const mensagemErro = err.error?.message || 'Falha no login. Verifique suas credenciais.';
          
          alert(mensagemErro);
        }
      });

    } else {
      // Exibe erros visuais nos inputs se o form for inválido
      this.loginForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos corretamente.');
    }
  }

  // Método auxiliar para centralizar a lógica de redirecionamento
  private redirecionarUsuario(): void {
    const usuario = this.authService.getUsuarioLogado();
    
    if (usuario?.perfil === 'supervisor') {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/central']);
    }
  }
}