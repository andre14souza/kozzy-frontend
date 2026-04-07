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
  @Input() filtrosSalvos: RelatorioFilters | null = null;
  @Input() listaAtendentes: { id: string; nome: string }[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() gerarRelatorioEvent = new EventEmitter<RelatorioFilters>();

  filterForm: FormGroup;

  readonly areas = ['Logística', 'T.I', 'Comercial', 'RH', 'Financeiro'];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      dataInicio: ['', Validators.required],
      dataFim:    ['', Validators.required],
      status:     [''],
      prioridade: [''],
      atendente:  [''],
      cliente:    [''],
      area:       [''],
      origem:     ['']
    });
  }

  ngOnInit(): void { this.carregarFiltrosSalvos(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) this.carregarFiltrosSalvos();
    if (changes['filtrosSalvos']) this.carregarFiltrosSalvos();
  }

  private carregarFiltrosSalvos(): void {
    if (this.filtrosSalvos) {
      this.filterForm.patchValue({
        dataInicio: this.filtrosSalvos.dataInicio || '',
        dataFim:    this.filtrosSalvos.dataFim    || '',
        status:     this.filtrosSalvos.status     || '',
        prioridade: this.filtrosSalvos.prioridade || '',
        atendente:  this.filtrosSalvos.atendente  || '',
        cliente:    this.filtrosSalvos.cliente    || '',
        area:       this.filtrosSalvos.area       || '',
        origem:     this.filtrosSalvos.origem     || ''
      });
    }
  }

  closeModalHandler(): void { this.closeModal.emit(); }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModalHandler();
  }

  gerarRelatorio(): void {
    if (this.filterForm.valid) {
      const v = this.filterForm.value;
      const filtros: RelatorioFilters = {
        dataInicio: v.dataInicio,
        dataFim:    v.dataFim,
        status:     v.status,
        prioridade: v.prioridade,
        atendente:  v.atendente,
        cliente:    v.cliente,
        area:       v.area,
        origem:     v.origem
      };
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
    if (field && field.errors?.['required']) return 'Campo obrigatório';
    return '';
  }

  limparFiltrosOpcionais(): void {
    this.filterForm.patchValue({ status: '', prioridade: '', atendente: '', cliente: '', area: '', origem: '' });
  }

  limparTodosFiltros(): void { this.filterForm.reset(); }
}