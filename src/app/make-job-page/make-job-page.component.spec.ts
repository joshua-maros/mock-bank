import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeJobPageComponent } from './make-job-page.component';

describe('MakeJobPageComponent', () => {
  let component: MakeJobPageComponent;
  let fixture: ComponentFixture<MakeJobPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MakeJobPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeJobPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
