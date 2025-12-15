import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioTabelaComponent } from './relatorio-tabela.component';

describe('RelatorioTabelaComponent', () => {
  let component: RelatorioTabelaComponent;
  let fixture: ComponentFixture<RelatorioTabelaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioTabelaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatorioTabelaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
