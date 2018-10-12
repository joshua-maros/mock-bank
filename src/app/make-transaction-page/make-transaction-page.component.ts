import { Component, OnInit, ViewChild } from '@angular/core';
import { WebappBackendService, Member, AccessLevel } from '../webapp-backend.service';
import { FormControl, FormGroupDirective, NgForm, Validators, AbstractControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import { sortMembers } from '../util';

/** Error when invalid control is dirty, touched, or submitted. */
export class AlwaysErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, fg: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = fg && fg.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-make-transaction-page',
  templateUrl: './make-transaction-page.component.html',
  styleUrls: ['./make-transaction-page.component.scss']
})
export class MakeTransactionPageComponent implements OnInit {
  members: Member[];
  reasons = [
    'Salary',
    'Payment',
    'Fine',
    'Rent',
    'Property Tax',
    'Law Fee',
    'Priviledge Pass',
    'Other Fee'
  ];

  alwaysMatcher = new AlwaysErrorStateMatcher();
  @ViewChild('form') form;
  fg = new FormGroup({
    from: new FormControl(null, Validators.required),
    to: new FormControl(null, Validators.required),
    amount: new FormControl(null, [
      Validators.required,
      Validators.min(0),
      (control: AbstractControl): {[key: string]: any} | null => {
        return this.fg && this.fg.value.from && control.value > this.fg.value.from.currentWealth ? {'max': {}} : null;
      }
    ]),
    reason: new FormControl('', Validators.required)
  });

  get AccessLevel() { // For *ngIfs
    return AccessLevel;
  }

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then(e => this.members = sortMembers(e, false));
  }

  ngOnInit() { }

  checkError(controlName: string, errorName: string): boolean {
    return this.fg.controls[controlName] && this.fg.controls[controlName].hasError(errorName);
  }

  submit() {
    const v = this.fg.value;
    this.fg.disable();
    this.backend.createTransaction(v.from, v.to, v.amount, v.reason).then(async (res) => {
      const oldFrom = v.from.id, oldTo = v.to.id;
      this.members = sortMembers(await this.backend.getCachedMemberList(), false);
      let newFrom: Member, newTo: Member;
      for (const member of this.members) {
        if (member.id === oldFrom) {
          newFrom = member;
        }
        if (member.id === oldTo) {
          newTo = member;
        }
      }
      this.form.resetForm();
      this.fg.patchValue({ amount: null, from: newFrom, to: newTo });
      this.fg.enable();
    });
  }
}
