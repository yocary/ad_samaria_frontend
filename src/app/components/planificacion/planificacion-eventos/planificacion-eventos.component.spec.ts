import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificacionEventosComponent } from './planificacion-eventos.component';

describe('PlanificacionEventosComponent', () => {
  let component: PlanificacionEventosComponent;
  let fixture: ComponentFixture<PlanificacionEventosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanificacionEventosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanificacionEventosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
