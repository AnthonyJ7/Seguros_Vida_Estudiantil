import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Polizas } from './polizas';

describe('Polizas', () => {
  let component: Polizas;
  let fixture: ComponentFixture<Polizas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Polizas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Polizas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
