import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chamado, NovoChamado } from '../chamados.service';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css']
})
export class CreateTicketModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() chamadoParaEditar?: Chamado | null;
  @Input() perfilUsuario: string = 'atendente';

  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();
  @Output() chamadoAtualizado = new EventEmitter<Chamado>();

  ticketForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  atendenteOptions: any[] = [];

  constructor(private fb: FormBuilder, private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.initializeForm();
    this.carregarAtendentes();
  }

  carregarAtendentes() {
    this.authService.getTodosUsuarios().subscribe({
      next: (usuarios: any[]) => {
        this.atendenteOptions = usuarios
          .filter(u => u.perfil === 'atendente')
          .map(u => ({ value: u.id || u._id, label: u.nome }));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.initializeForm(); 
      if (this.isEditMode) this.populateFormForEdit();
    }
  }

  initializeForm() {
    this.ticketForm = this.fb.group({
      origem: ['email', Validators.required],
      status: ['aberto', Validators.required],
      numeroProtocolo: [{ value: '', disabled: true }],
      cliente: ['', Validators.required],
      area: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: [''], 
      prioridade: ['Média Prioridade'],
      descricao: ['', Validators.maxLength(500)],
      data: [new Date().toISOString().split('T')[0]],
      hora: [new Date().toTimeString().slice(0, 5)]
    });
  }

  populateFormForEdit() {
    if (!this.chamadoParaEditar) return;
    const a = this.chamadoParaEditar.atendente;
    const id = (a && typeof a === 'object') ? (a.id || a._id) : a;
    this.ticketForm.patchValue({
      origem: this.chamadoParaEditar.origem,
      status: this.chamadoParaEditar.status,
      cliente: this.chamadoParaEditar.cliente,
      area: this.chamadoParaEditar.area,
      atendente: id || '',
      prioridade: this.chamadoParaEditar.prioridade,
      descricao: this.chamadoParaEditar.descricao
    });
  }

  salvar() {
    if (this.ticketForm.invalid) return;
    this.isLoading = true;

    const val = this.ticketForm.getRawValue();
    const user = this.authService.getUsuarioLogado();

    let atendenteFinal;
    if (this.isEditMode) {
      const opt = this.atendenteOptions.find(o => o.value === val.atendente);
      atendenteFinal = opt ? { _id: opt.value, nomeCompleto: opt.label } : val.atendente;
    } else {
      atendenteFinal = { _id: user?.id, nomeCompleto: user?.nome };
    }

    const dados = { ...val, atendente: atendenteFinal };

    if (this.isEditMode) {
      this.chamadoAtualizado.emit({ ...this.chamadoParaEditar, ...dados } as any);
    } else {
      this.chamadoCriado.emit(dados as any);
    }
    this.isLoading = false;
    this.close();
  }

  close() { this.closeModal.emit(); }
}