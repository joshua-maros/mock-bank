import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayHintComponent } from './overlay-hint.component';

describe('OverlayHintComponent', () => {
  let component: OverlayHintComponent;
  let fixture: ComponentFixture<OverlayHintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverlayHintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
