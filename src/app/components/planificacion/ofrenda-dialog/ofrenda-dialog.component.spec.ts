import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfrendaDialogComponent } from './ofrenda-dialog.component';

describe('OfrendaDialogComponent', () => {
  let component: OfrendaDialogComponent;
  let fixture: ComponentFixture<OfrendaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OfrendaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfrendaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
