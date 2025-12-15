// src/app/recuperar/recuperar.component.ts (CÓDIGO COMPLETO E ATUALIZADO)

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service'; // Importe o AuthService

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './recuperar.component.html',
  styleUrls: ['./recuperar.component.css']
})
export class RecuperarComponent implements OnInit {
  recuperarForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Injete o serviço
  ) { }

  ngOnInit(): void {
    this.recuperarForm = this.fb.group({
      email: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.recuperarForm.valid) {
      const { email } = this.recuperarForm.value;
      
      const senha = this.authService.recuperarSenha(email);

      if (senha) {
        // SIMULAÇÃO PARA AMBIENTE SEM BANCO DE DADOS
        alert(`SIMULAÇÃO DE RECUPERAÇÃO:\nA senha para o usuário '${email}' é: "${senha}"`);
      } else {
        alert(`Usuário com o e-mail ou nome de usuário '${email}' não foi encontrado.`);
      }
      this.router.navigate(['/login']);
    } else {
      this.recuperarForm.markAllAsTouched();
      alert('Por favor, digite um e-mail ou usuário válido.');
    }
  }

  goToLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }
}