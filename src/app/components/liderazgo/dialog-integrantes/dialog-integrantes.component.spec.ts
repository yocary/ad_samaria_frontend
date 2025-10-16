import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogIntegrantesComponent } from './dialog-integrantes.component';

describe('DialogIntegrantesComponent', () => {
  let component: DialogIntegrantesComponent;
  let fixture: ComponentFixture<DialogIntegrantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogIntegrantesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogIntegrantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
