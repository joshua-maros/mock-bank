import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeMemberPageComponent } from './make-member-page.component';

describe('MakeMemberPageComponent', () => {
  let component: MakeMemberPageComponent;
  let fixture: ComponentFixture<MakeMemberPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MakeMemberPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeMemberPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
