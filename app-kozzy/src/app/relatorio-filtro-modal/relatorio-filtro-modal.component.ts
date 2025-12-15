import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RelatorioFilters } from '../chamados.service';

@Component({
  selector: 'app-relatorio-filtro-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './relatorio-filtro-modal.component.html',
  styleUrls: ['./relatorio-filtro-modal.component.css']
})
export class RelatorioFiltroModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  
  // Mantivemos o nome original para compatibilidade
  @Input() filtrosSalvos: RelatorioFilters | null = null; 
  
  @Output() closeModal = new EventEmitter<void>();
  
  // IMPORTANTE: Nome voltado ao original para o Supervisor não quebrar
  @Output() gerarRelatorioEvent = new EventEmitter<RelatorioFilters>();

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      status: [''],
      prioridade: [''],
      atendente: [''],
      cliente: ['']
    });
  }

  ngOnInit(): void {
    this.carregarFiltrosSalvos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.carregarFiltrosSalvos();
    }
    if (changes['filtrosSalvos']) {
      this.carregarFiltrosSalvos();
    }
  }

  private carregarFiltrosSalvos(): void {
    if (this.filtrosSalvos) {
      this.filterForm.patchValue({
        dataInicio: this.filtrosSalvos.dataInicio || '',
        dataFim: this.filtrosSalvos.dataFim || '',
        status: this.filtrosSalvos.status || '',
        prioridade: this.filtrosSalvos.prioridade || '',
        atendente: this.filtrosSalvos.atendente || '',
        cliente: this.filtrosSalvos.cliente || ''
      });
    }
  }

  closeModalHandler(): void {
    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModalHandler();
    }
  }

  // Este método é chamado pelo (ngSubmit) no HTML
  gerarRelatorio(): void {
    if (this.filterForm.valid) {
      const filtros: RelatorioFilters = {
        dataInicio: this.filterForm.value.dataInicio,
        dataFim: this.filterForm.value.dataFim,
        status: this.filterForm.value.status,
        prioridade: this.filterForm.value.prioridade,
        atendente: this.filterForm.value.atendente,
        cliente: this.filterForm.value.cliente
      };

      // Emite o evento com o nome correto
      this.gerarRelatorioEvent.emit(filtros);
    } else {
      this.filterForm.markAllAsTouched();
    }
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.filterForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.filterForm.get(fieldName);
    if (field && field.errors?.['required']) {
      return 'Campo obrigatório';
    }
    return '';
  }

  limparFiltrosOpcionais(): void {
    this.filterForm.patchValue({ status: '', prioridade: '', atendente: '', cliente: '' });
  }

  limparTodosFiltros(): void {
    this.filterForm.reset();
  }
}