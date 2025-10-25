import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearUsuarioDialogComponent } from './crear-usuario-dialog.component';

describe('CrearUsuarioDialogComponent', () => {
  let component: CrearUsuarioDialogComponent;
  let fixture: ComponentFixture<CrearUsuarioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrearUsuarioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearUsuarioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
