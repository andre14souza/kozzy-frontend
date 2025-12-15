import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioFiltroModalComponent } from './relatorio-filtro-modal.component';

describe('RelatorioFiltroModalComponent', () => {
  let component: RelatorioFiltroModalComponent;
  let fixture: ComponentFixture<RelatorioFiltroModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioFiltroModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatorioFiltroModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
