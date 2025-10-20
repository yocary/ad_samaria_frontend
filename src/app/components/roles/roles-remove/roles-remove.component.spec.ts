import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesRemoveComponent } from './roles-remove.component';

describe('RolesRemoveComponent', () => {
  let component: RolesRemoveComponent;
  let fixture: ComponentFixture<RolesRemoveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesRemoveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RolesRemoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
