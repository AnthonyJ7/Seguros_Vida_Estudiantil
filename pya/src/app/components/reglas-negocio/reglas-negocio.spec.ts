import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReglasNegocio } from './reglas-negocio';

describe('ReglasNegocio', () => {
  let component: ReglasNegocio;
  let fixture: ComponentFixture<ReglasNegocio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReglasNegocio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReglasNegocio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
