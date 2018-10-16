import { Component, OnInit, ViewChild } from '@angular/core';
import { WebappBackendService, Member, AccessLevel, Class } from '../webapp-backend.service';
import { FormControl, FormGroupDirective, NgForm, Validators, AbstractControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import { sortMembers } from '../util';
import { FadeHintComponent } from '../fade-hint/fade-hint.component';

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
  @ViewChild('hint') hint: FadeHintComponent;
  members: Member[];
  numOranges: number;
  numBlues: number;
  reasons = [
    'Payment',
    'Rent',
    'Salary',
    'Fine',
    'Property Tax',
    'Law Fee',
    'Income Tax',
    'Priviledge Pass',
    'Other Fee',
    'Random Event',
    'Bankruptcy',
    'Starting Balance',
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

  get newBalanceForFrom() {
    const v = this.fg.value;
    let multiplier = 1;
    if (v.to.firstName === 'All') {
      if (v.to.lastName === 'Oranges') {
        multiplier = this.numOranges;
      } else if (v.to.lastName === 'Blues') {
        multiplier = this.numBlues;
      }
    }
    return v.from.currentWealth - v.amount * multiplier;
  }

  get newBalanceForTo() {
    const v = this.fg.value;
    let multiplier = 1;
    if (v.from.firstName === 'All') {
      if (v.from.lastName === 'Oranges') {
        multiplier = this.numOranges;
      } else if (v.from.lastName === 'Blues') {
        multiplier = this.numBlues;
      }
    }
    return v.to.currentWealth + v.amount * multiplier;
  }

  private async updateMembers() {
    const members = this.backend.getCachedMemberList();
    const allBlues = this.backend.getClassSummary(Class.BLUE, 'Blues');
    const allOranges = this.backend.getClassSummary(Class.ORANGE, 'Oranges');
    this.members = sortMembers((await members).concat([await allBlues, await allOranges]), false);
    this.numOranges = 0;
    this.numBlues = 0;
    for (const member of this.members) {
      if (member.class === Class.ORANGE) {
        this.numOranges += 1;
      } else if (member.class === Class.BLUE) {
        this.numBlues += 1;
      }
    }
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
      try {
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
          this.hint.showError('Cannot send from one group to another.');
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
        const oldFrom = v.from.id, oldTo = v.to.id, oldAmount = v.amount, oldReason = v.reason;
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
        this.hint.showMessage('Transaction created!');
        this.form.resetForm();
        this.fg.patchValue({ amount: oldAmount, reason: oldReason, from: newFrom, to: newTo });
        this.fg.enable();
      } catch {
        this.hint.showError('Error encountered while processing transaction!');
      }
    })();
  }
}
