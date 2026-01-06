import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Siniestros } from './siniestros';

describe('Siniestros', () => {
  let component: Siniestros;
  let fixture: ComponentFixture<Siniestros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Siniestros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Siniestros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
