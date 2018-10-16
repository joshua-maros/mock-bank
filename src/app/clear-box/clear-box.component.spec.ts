import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClearBoxComponent } from './clear-box.component';

describe('ClearBoxComponent', () => {
  let component: ClearBoxComponent;
  let fixture: ComponentFixture<ClearBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClearBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClearBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
