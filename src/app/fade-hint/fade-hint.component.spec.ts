import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FadeHintComponent } from './fade-hint.component';

describe('FadeHintComponent', () => {
  let component: FadeHintComponent;
  let fixture: ComponentFixture<FadeHintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FadeHintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FadeHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
