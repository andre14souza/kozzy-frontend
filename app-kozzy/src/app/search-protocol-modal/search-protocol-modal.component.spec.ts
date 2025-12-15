import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchProtocolModalComponent } from './search-protocol-modal.component';

describe('SearchProtocolModalComponent', () => {
  let component: SearchProtocolModalComponent;
  let fixture: ComponentFixture<SearchProtocolModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchProtocolModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchProtocolModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
