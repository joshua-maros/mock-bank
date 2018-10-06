import { Component, OnInit } from '@angular/core';
import { WebappBackendService, Member, AccessLevel } from '../webapp-backend.service';
import { FormControl, FormGroupDirective, NgForm, Validators, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';

/** Error when invalid control is dirty, touched, or submitted. */
export class AlwaysErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-make-transaction-page',
  templateUrl: './make-transaction-page.component.html',
  styleUrls: ['./make-transaction-page.component.scss']
})
export class MakeTransactionPageComponent implements OnInit {
  private members: Member[];

  alwaysMatcher = new AlwaysErrorStateMatcher();
  fromfc = new FormControl(null, Validators.required);
  tofc = new FormControl(null, Validators.required);
  amountfc = new FormControl(0, [
    Validators.min(0),
    (control: AbstractControl): {[key: string]: any} | null => {
      return this.fromfc.value && control.value > this.fromfc.value.currentWealth ? {'max': {}} : null;
    }
  ]);

  get AccessLevel() { // For *ngIfs
    return AccessLevel;
  }

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then(e => this.members = e);
  }

  ngOnInit() { }
}
