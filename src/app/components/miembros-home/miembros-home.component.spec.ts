import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiembrosHomeComponent } from './miembros-home.component';

describe('MiembrosHomeComponent', () => {
  let component: MiembrosHomeComponent;
  let fixture: ComponentFixture<MiembrosHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MiembrosHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MiembrosHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
