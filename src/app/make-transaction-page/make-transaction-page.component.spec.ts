import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeTransactionPageComponent } from './make-transaction-page.component';

describe('MakeTransactionPageComponent', () => {
  let component: MakeTransactionPageComponent;
  let fixture: ComponentFixture<MakeTransactionPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MakeTransactionPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeTransactionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
