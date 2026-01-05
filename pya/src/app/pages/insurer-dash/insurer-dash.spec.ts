import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsurerDash } from './insurer-dash';

describe('InsurerDash', () => {
  let component: InsurerDash;
  let fixture: ComponentFixture<InsurerDash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsurerDash]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsurerDash);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
