import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificacionGrupoIntegrantesComponent } from './planificacion-grupo-integrantes.component';

describe('PlanificacionGrupoIntegrantesComponent', () => {
  let component: PlanificacionGrupoIntegrantesComponent;
  let fixture: ComponentFixture<PlanificacionGrupoIntegrantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanificacionGrupoIntegrantesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanificacionGrupoIntegrantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
