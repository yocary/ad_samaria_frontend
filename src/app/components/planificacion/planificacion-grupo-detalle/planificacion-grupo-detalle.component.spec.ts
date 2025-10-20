import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificacionGrupoDetalleComponent } from './planificacion-grupo-detalle.component';

describe('PlanificacionGrupoDetalleComponent', () => {
  let component: PlanificacionGrupoDetalleComponent;
  let fixture: ComponentFixture<PlanificacionGrupoDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanificacionGrupoDetalleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanificacionGrupoDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
