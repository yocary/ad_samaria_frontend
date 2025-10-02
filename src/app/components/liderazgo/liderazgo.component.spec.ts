import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiderazgoComponent } from './liderazgo.component';

describe('LiderazgoComponent', () => {
  let component: LiderazgoComponent;
  let fixture: ComponentFixture<LiderazgoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiderazgoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LiderazgoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
