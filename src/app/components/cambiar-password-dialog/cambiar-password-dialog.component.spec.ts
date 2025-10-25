import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CambiarPasswordDialogComponent } from './cambiar-password-dialog.component';

describe('CambiarPasswordDialogComponent', () => {
  let component: CambiarPasswordDialogComponent;
  let fixture: ComponentFixture<CambiarPasswordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CambiarPasswordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CambiarPasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
