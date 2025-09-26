import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditFamilyComponent } from './dialog-edit-family.component';

describe('DialogEditFamilyComponent', () => {
  let component: DialogEditFamilyComponent;
  let fixture: ComponentFixture<DialogEditFamilyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogEditFamilyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogEditFamilyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
