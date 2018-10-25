import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PinToolPageComponent } from './pin-tool-page.component';

describe('PinToolPageComponent', () => {
  let component: PinToolPageComponent;
  let fixture: ComponentFixture<PinToolPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PinToolPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PinToolPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
