import { Component, OnInit, ViewChild } from '@angular/core';
import { WebappBackendService, Member, AccessLevel, Class, MemberGroup } from '../webapp-backend.service';
import { FormControl, FormGroupDirective, NgForm, Validators, AbstractControl, FormGroup, FormBuilder } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import { sortMembers } from '../util';
import { OverlayHintComponent } from '../overlay-hint/overlay-hint.component';

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
  @ViewChild('hint') hint: OverlayHintComponent;
  members: (Member | MemberGroup)[];
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
  fg = this.fb.group({
    from: [null, Validators.required],
    to: [null, Validators.required],
    amount: [null, [
      Validators.required,
      Validators.min(0)
    ]],
    reason: ['', Validators.required],
    splitGroup: [false],
    allowDebt: [false]
  }, { 
    validator: (control: AbstractControl): {[key: string]: any} | null => {
      return control.value && !control.value.allowDebt && control.value.from 
        && this.computeBalanceForFrom(control.value.amount) < 0 ? {'max': {}} : null;
    }
  });

  get AccessLevel() { // For *ngIfs
    return AccessLevel;
  }
  
  get f() {
    return Math.floor;
  }

  private computeBalanceForFrom(amount: number) {
    const v = this.fg.value;
    if (!v.from) {
      return 0;
    }
    if (!v.to) {
      return v.from.currentWealth;
    }
    if (v.splitGroup) {
      if (v.from.members) {
        return v.from.currentWealth - Math.ceil(amount / v.from.members.length);
      } else {
        return v.from.currentWealth - amount;
      }
    } else {
      return v.from.currentWealth - amount * (v.to.members ? v.to.members.length : 1);
    }
  }

  get newBalanceForFrom() {
    return this.computeBalanceForFrom(this.fg.value.amount);
  }

  get newBalanceForTo() {
    const v = this.fg.value;
    if (!v.to) {
      return 0;
    }
    if (!v.from) {
      return v.to.currentWealth;
    }
    if (v.splitGroup) {
      if (v.to.members) {
        return v.to.currentWealth + Math.ceil(v.amount / v.to.members.length);
      } else {
        return v.to.currentWealth + v.amount;
      }
    } else {
      return v.to.currentWealth + v.amount * (v.from.members ? v.from.members.length : 1);
    }
  }

  private async updateMembers() {
    const members = this.backend.getCachedMemberList();
    const allBlues = this.backend.getClassSummary(Class.BLUE, 'Blues');
    const allOranges = this.backend.getClassSummary(Class.ORANGE, 'Oranges');
    const allMembers = (<(Member | MemberGroup)[]> await members).concat([await allBlues, await allOranges]);
    this.members = sortMembers(allMembers, false);
  }

  constructor(private backend: WebappBackendService, private fb: FormBuilder) { }

  ngOnInit() {
    this.updateMembers();
    // TODO: Replace this with some kind of global validator.
    /* this.fg.valueChanges.subscribe(() => {
      if (!this.fg.value.from || !this.fg.value.to) {
        return;
      }
      if (this.fg.value.from.members && this.fg.value.to.members) {
        this.hint.showError('Cannot send from one group to another.')
      }
    }); */
  }

  checkError(controlName: string, errorName: string): boolean {
    return this.fg.controls[controlName] && this.fg.controls[controlName].hasError(errorName);
  }

  private async getClassList(clas: Class) {
    const result = [];
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
    const from = v.from.members || [v.from];
    const to = v.to.members || [v.to];
    console.log(this.hint);
    (async () => {
      try {
        if (to.length > 1 && from.length > 1) {
          this.hint.showError('Cannot send from one group to another.');
          this.fg.enable();
          return;
        }
        if (to.length > 1) {
          let amount = v.amount;
          if (v.splitGroup) {
            amount = amount / to.length;
          }
          for (const m of to) {
            await this.backend.createTransaction(v.from, m, amount, v.reason);
          }
        } else if (from.length > 1) {
          let amount = v.amount;
          if (v.splitGroup) {
            amount = amount / from.length;
          }
          for (const m of from) {
            await this.backend.createTransaction(m, v.to, v.amount, v.reason);
          }
        } else {
          await this.backend.createTransaction(v.from, v.to, v.amount, v.reason);
        }
        const oldFrom = v.from.id, oldTo = v.to.id, oldAmount = v.amount, oldReason = v.reason, oldSplit = v.splitGroup;
        await this.updateMembers();
        let newFrom: Member | MemberGroup, newTo: Member | MemberGroup;
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
        this.fg.patchValue({ amount: oldAmount, reason: oldReason, from: newFrom, to: newTo, splitGroup: oldSplit });
        this.fg.enable();
      } catch {
        this.hint.showError('Error encountered while processing transaction!');
      }
    })();
  }
}
