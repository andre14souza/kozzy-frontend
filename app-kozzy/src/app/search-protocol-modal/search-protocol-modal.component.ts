import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-protocol-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-protocol-modal.component.html',
  styleUrls: ['./search-protocol-modal.component.css']
})
export class SearchProtocolModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  protocoloInput: string = '';

  onSearch(): void {
    if (this.protocoloInput.trim()) {
      this.search.emit(this.protocoloInput.trim());
      this.protocoloInput = '';
    }
  }

  onClose(): void {
    this.close.emit();
    this.protocoloInput = '';
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}