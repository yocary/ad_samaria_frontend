import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDiezmosComponent } from './dialog-diezmos.component';

describe('DialogDiezmosComponent', () => {
  let component: DialogDiezmosComponent;
  let fixture: ComponentFixture<DialogDiezmosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogDiezmosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogDiezmosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
