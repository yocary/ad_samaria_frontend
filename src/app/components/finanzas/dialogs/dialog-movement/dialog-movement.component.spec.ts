import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMovementComponent } from './dialog-movement.component';

describe('DialogMovementComponent', () => {
  let component: DialogMovementComponent;
  let fixture: ComponentFixture<DialogMovementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogMovementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogMovementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
