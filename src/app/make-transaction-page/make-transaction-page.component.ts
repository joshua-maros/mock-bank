import { Component, OnInit, ViewChild } from '@angular/core';
import { WebappBackendService, Member, AccessLevel, Class } from '../webapp-backend.service';
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
    'Random Event',
    'Class Reset',
    'Starting Balance',
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

  private async updateMembers() {
    const members = this.backend.getCachedMemberList();
    const allBlues = this.backend.getClassSummary(Class.BLUE, 'Blues');
    const allOranges = this.backend.getClassSummary(Class.ORANGE, 'Oranges');
    this.members = sortMembers((await members).concat([await allBlues, await allOranges]), false);
  }

  constructor(private backend: WebappBackendService) {
    this.updateMembers();
  }

  ngOnInit() { }

  checkError(controlName: string, errorName: string): boolean {
    return this.fg.controls[controlName] && this.fg.controls[controlName].hasError(errorName);
  }

  private async getClassList(clas: Class) {
    let result = [];
    for (const member of await this.backend.getCachedMemberList()) {
      if (member.class === clas) {
        result.push(member);
      }
    }
    return result;
  }

  submit() {
    const v = this.fg.value;
    this.fg.disable();
    let from = [v.from], to = [v.to];
    (async () => {
      if (v.from.id === 'ALL_BLUES') {
        from = await this.getClassList(Class.BLUE);
      }
      if (v.from.id === 'ALL_ORANGES') {
        from = await this.getClassList(Class.ORANGE);
      }
      if (v.to.id === 'ALL_BLUES') {
        to = await this.getClassList(Class.BLUE);
      }
      if (v.to.id === 'ALL_ORANGES') {
        to = await this.getClassList(Class.ORANGE);
      }
      if (to.length > 1 && from.length > 1) {
        this.fg.enable();
        return;
      }
      if (to.length > 1) {
        for (const m of to) {
          await this.backend.createTransaction(v.from, m, v.amount, v.reason);
        }
      } else if (from.length > 1) {
        for (const m of from) {
          await this.backend.createTransaction(m, v.to, v.amount, v.reason);
        }
      } else {
        await this.backend.createTransaction(v.from, v.to, v.amount, v.reason);
      }
      const oldFrom = v.from.id, oldTo = v.to.id;
      await this.updateMembers();
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
    })();
  }
}
