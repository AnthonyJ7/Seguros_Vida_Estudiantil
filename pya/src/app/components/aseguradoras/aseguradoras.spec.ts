import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Aseguradoras } from './aseguradoras';

describe('Aseguradoras', () => {
  let component: Aseguradoras;
  let fixture: ComponentFixture<Aseguradoras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aseguradoras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Aseguradoras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
