import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentralAtendimentoComponent } from './central-atendimento.component';

describe('CentralAtendimentoComponent', () => {
  let component: CentralAtendimentoComponent;
  let fixture: ComponentFixture<CentralAtendimentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentralAtendimentoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CentralAtendimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
