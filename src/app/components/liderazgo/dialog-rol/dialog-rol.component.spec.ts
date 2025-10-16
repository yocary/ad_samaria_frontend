import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogRolComponent } from './dialog-rol.component';

describe('DialogRolComponent', () => {
  let component: DialogRolComponent;
  let fixture: ComponentFixture<DialogRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogRolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
