import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoNewDialogComponent } from './evento-new-dialog.component';

describe('EventoNewDialogComponent', () => {
  let component: EventoNewDialogComponent;
  let fixture: ComponentFixture<EventoNewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventoNewDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventoNewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
