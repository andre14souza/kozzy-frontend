import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriarUsuarioModalComponent } from './criar-usuario-modal.component';

describe('CriarUsuarioModalComponent', () => {
  let component: CriarUsuarioModalComponent;
  let fixture: ComponentFixture<CriarUsuarioModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriarUsuarioModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CriarUsuarioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
