import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChamadosService, Chamado } from '../chamados.service';

@Component({
  selector: 'app-buscar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar-cliente.component.html',
  styleUrls: ['./buscar-cliente.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-30px)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class BuscarClienteComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  searchTerm: string = '';
  lastSearchTerm: string = '';
  filteredChamados: Chamado[] = [];
  searchPerformed: boolean = false;

  constructor(private chamadosService: ChamadosService) { }

  ngOnInit(): void {
    // Opcional: carregar todos os chamados ou os mais recentes ao abrir o modal
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModalHandler();
    }
  }

  closeModalHandler(): void {
    this.closeModal.emit();
    this.resetSearch();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.lastSearchTerm = '';
    this.filteredChamados = [];
    this.searchPerformed = false;
  }

  onSearchTermChange(): void {
    // Limpar resultados se o termo de busca for esvaziado
    if (this.searchTerm.length < 2 && this.searchPerformed) {
      this.resetSearch();
    }
  }

  performSearch(): void {
    if (!this.searchTerm || this.searchTerm.length < 2) {
      this.filteredChamados = [];
      this.searchPerformed = true;
      this.lastSearchTerm = this.searchTerm;
      return;
    }

    this.lastSearchTerm = this.searchTerm;
    this.filteredChamados = this.chamadosService.buscarChamadosPorCliente(this.searchTerm);
    this.searchPerformed = true;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'aberto': return 'Aberto';
      case 'em-andamento': return 'Em Andamento';
      case 'fechado': return 'Fechado';
      default: return 'Desconhecido';
    }
  }

  formatDateTime(dateString: string, timeString: string): string {
    const date = new Date(dateString + 'T' + timeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}