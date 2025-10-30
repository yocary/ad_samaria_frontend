import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddDiezmoComponent } from './dialog-add-diezmo.component';

describe('DialogAddDiezmoComponent', () => {
  let component: DialogAddDiezmoComponent;
  let fixture: ComponentFixture<DialogAddDiezmoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogAddDiezmoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAddDiezmoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
