import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditMinistryComponent } from './dialog-edit-ministry.component';

describe('DialogEditMinistryComponent', () => {
  let component: DialogEditMinistryComponent;
  let fixture: ComponentFixture<DialogEditMinistryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogEditMinistryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogEditMinistryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
