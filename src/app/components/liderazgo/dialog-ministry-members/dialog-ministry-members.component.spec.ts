import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMinistryMembersComponent } from './dialog-ministry-members.component';

describe('DialogMinistryMembersComponent', () => {
  let component: DialogMinistryMembersComponent;
  let fixture: ComponentFixture<DialogMinistryMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogMinistryMembersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogMinistryMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
