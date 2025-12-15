import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

export function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha');
  const confirmarSenha = control.get('confirmarSenha');
  if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
    confirmarSenha.setErrors({ senhasNaoCoincidem: true });
    return { senhasNaoCoincidem: true };
  }
  return null;
}

@Component({
  selector: 'app-criar-usuario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './criar-usuario-modal.component.html',
  styleUrls: ['./criar-usuario-modal.component.css']
})
export class CriarUsuarioModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() usuarioCriado = new EventEmitter<string>();

  criarUsuarioForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
  }

  // --- MÁGICA DO RESET ---
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.resetForm();
    }
  }

  inicializarForm() {
    this.criarUsuarioForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.minLength(3)]],
      perfil: ['atendente', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: senhasIguaisValidator });
  }

  resetForm() {
    if (this.criarUsuarioForm) {
      this.criarUsuarioForm.reset({
        perfil: 'atendente' // Mantém o padrão selecionado
      });
    }
  }

  onSubmit(): void {
    if (this.criarUsuarioForm.valid) {
      const { nome, email, perfil, senha } = this.criarUsuarioForm.value;

      const dadosNovoUsuario = {
        nome,
        email,
        perfil,
        password: senha
      };

      this.authService.criarUsuario(dadosNovoUsuario).subscribe({
        next: (response) => {
          const msg = response.message || 'Usuário criado com sucesso!';
          this.usuarioCriado.emit(msg);
          this.onClose(); 
        },
        error: (err) => {
          console.error('Erro ao criar usuário:', err);
          const msgErro = err.error?.message || 'Erro ao criar usuário.';
          alert(msgErro);
        }
      });
      
    } else {
      this.criarUsuarioForm.markAllAsTouched();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}