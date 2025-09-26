import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddFamilyComponent } from './dialog-add-family.component';

describe('DialogAddFamilyComponent', () => {
  let component: DialogAddFamilyComponent;
  let fixture: ComponentFixture<DialogAddFamilyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogAddFamilyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAddFamilyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
