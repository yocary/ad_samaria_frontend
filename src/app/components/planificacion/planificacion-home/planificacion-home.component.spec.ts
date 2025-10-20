import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificacionHomeComponent } from './planificacion-home.component';

describe('PlanificacionHomeComponent', () => {
  let component: PlanificacionHomeComponent;
  let fixture: ComponentFixture<PlanificacionHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanificacionHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanificacionHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
