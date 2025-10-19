import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberCardDialogComponent } from './member-card-dialog.component';

describe('MemberCardDialogComponent', () => {
  let component: MemberCardDialogComponent;
  let fixture: ComponentFixture<MemberCardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MemberCardDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
