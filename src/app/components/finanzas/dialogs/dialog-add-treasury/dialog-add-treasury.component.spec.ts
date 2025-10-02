import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddTreasuryComponent } from './dialog-add-treasury.component';

describe('DialogAddTreasuryComponent', () => {
  let component: DialogAddTreasuryComponent;
  let fixture: ComponentFixture<DialogAddTreasuryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogAddTreasuryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAddTreasuryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
