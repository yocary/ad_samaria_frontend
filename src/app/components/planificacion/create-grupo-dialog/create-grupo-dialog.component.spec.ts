import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGrupoDialogComponent } from './create-grupo-dialog.component';

describe('CreateGrupoDialogComponent', () => {
  let component: CreateGrupoDialogComponent;
  let fixture: ComponentFixture<CreateGrupoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateGrupoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGrupoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
