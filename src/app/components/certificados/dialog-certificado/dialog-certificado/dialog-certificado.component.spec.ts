import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCertificadoComponent } from './dialog-certificado.component';

describe('DialogCertificadoComponent', () => {
  let component: DialogCertificadoComponent;
  let fixture: ComponentFixture<DialogCertificadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogCertificadoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogCertificadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
