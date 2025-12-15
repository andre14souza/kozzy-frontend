import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioScreenComponent } from './relatorio-screen.component';

describe('RelatorioScreenComponent', () => {
  let component: RelatorioScreenComponent;
  let fixture: ComponentFixture<RelatorioScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioScreenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatorioScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
