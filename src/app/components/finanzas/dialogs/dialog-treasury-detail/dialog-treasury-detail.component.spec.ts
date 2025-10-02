import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTreasuryDetailComponent } from './dialog-treasury-detail.component';

describe('DialogTreasuryDetailComponent', () => {
  let component: DialogTreasuryDetailComponent;
  let fixture: ComponentFixture<DialogTreasuryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogTreasuryDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTreasuryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
