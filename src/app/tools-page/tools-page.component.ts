import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators, NgForm, AbstractControl } from '@angular/forms';
import { Member, WebappBackendService, Class, MemberGroup } from '../webapp-backend.service';
import { sortMembers } from '../util';
import { OverlayHintComponent } from '../overlay-hint/overlay-hint.component';

@Component({
  selector: 'app-tools-page',
  templateUrl: './tools-page.component.html',
  styleUrls: ['./tools-page.component.scss']
})
export class ToolsPageComponent implements OnInit {
  public members: (Member | MemberGroup)[];
  public showPIN = '';

  @ViewChild('pinHint') pinHint: OverlayHintComponent;
  @ViewChild('pinForm') pinForm: NgForm;
  public pinFg = this.fb.group({
    oldPin: [null, Validators.required],
    newPin: [null, Validators.required],
    confirmPin: [null, Validators.required]
  });

  @ViewChild('rofHint') rofHint: OverlayHintComponent;
  @ViewChild('rofForm') rofForm: NgForm;
  public rofFg = this.fb.group({
    bluePerson: [null, Validators.required],
    orangePerson: [null, Validators.required]
  });

  @ViewChild('promoteHint') promoteHint: OverlayHintComponent;
  @ViewChild('promoteForm') promoteForm: NgForm;
  public promoteFg = this.fb.group({
    threshold: [550, Validators.required],
    person: [null, Validators.required],
    confirm: [false, Validators.requiredTrue]
  });

  @ViewChild('salaryHint') salaryHint: OverlayHintComponent;
  @ViewChild('salaryForm') salaryForm: NgForm;
  public salaryFg = this.fb.group({
    taxRate: [0],
    taxBlues: [false],
    taxOranges: [false],
    taxDestination: [null]
  });

  @ViewChild('majorHint') majorHint: OverlayHintComponent;
  @ViewChild('majorForm') majorForm: NgForm;
  public majorFg = this.fb.group({});

  @ViewChild('pinToolForm') pinToolForm: NgForm;
  public pinToolFg = this.fb.group({
    person: [null, Validators.required]
  });

  get oranges() {
    return this.members.filter(e => e.class === Class.ORANGE);
  }

  get richOranges() {
    return this.oranges.filter(e => e.currentWealth >= this.promoteFg.value.threshold);
  }

  get blues() {
    return this.members.filter(e => e.class === Class.BLUE);
  }

  get minBlue() {
    let minWealth = 1e10;
    let minBlue: Member | MemberGroup = null;
    for (const blue of this.blues) {
      if (blue.currentWealth < minWealth) {
        minWealth = blue.currentWealth;
        minBlue = blue;
      }
    }
    return minBlue;
  }

  constructor(private backend: WebappBackendService, private fb: FormBuilder) {
    this.promoteFg.get('threshold').valueChanges.subscribe(e => {
      this.promoteFg.get('person').reset();
      this.promoteFg.get('person').markAsDirty();
    });
  }

  async updateData() {
    this.members = sortMembers(await this.backend.getCachedMemberList(), true);
  }

  ngOnInit() {
    this.updateData();
  }

  doPINAnim() {
    setTimeout(() => {
      this.showPIN = '';
    }, 5 * 1000);
  }

  changePin() {
    this.pinFg.disable();
    const v = this.pinFg.value;
    if (v.newPin !== v.confirmPin) {
      this.pinHint.showError('New PINs do not match.');
      this.pinFg.enable();
      return;
    }
    (async () => {
      try {
        const result = await this.backend.changePin(v.oldPin, v.newPin);
        if (result.ok) {
          this.pinHint.showMessage('PIN changed.');
          this.pinForm.resetForm();
        } else {
          this.pinHint.showError('Could not change PIN.');
        }
      } catch {
        this.pinHint.showError('Could not change PIN.');
      }
      this.pinFg.enable();
    })();
  }

  doRof() {
    this.rofFg.disable();
    const v = this.rofFg.value;
    (async () => {
      try {
        const result = await this.backend.swapMembers(v.bluePerson, v.orangePerson);
        if (result.ok) {
          this.rofHint.showMessage('Swap was successful.');
          this.rofForm.resetForm();
          await this.updateData();
        } else {
          this.rofHint.showError('Swap was not successful, try again.');
        }
      } catch {
          this.rofHint.showError('Swap was not successful, try again.');
      }
      this.rofFg.enable();
    })();
  }

  promoteOrange() {
    this.promoteFg.disable();
    const v = this.promoteFg.value;
    (async () => {
      try {
        const result = await this.backend.promoteMember(v.person);
        if (result.ok) {
          this.promoteHint.showMessage(`Successfully promoted ${v.person.firstName} ${v.person.lastName}.`);
          this.promoteForm.resetForm();
          await this.updateData();
        } else {
          this.promoteHint.showError('Promotion failed, try again.');
        }
      } catch {
          this.promoteHint.showError('Promotion failed, try again.');
      }
      this.promoteFg.enable();
    })();
  }

  paySalaries() {
    this.salaryFg.disable();
    const v = this.salaryFg.value;
    (async () => {
      try {
        const result = await this.backend.paySalaries();
        if (result.ok) {
          this.salaryHint.showMessage('Salaries are now paid.');
          await this.updateData();
        } else {
          this.salaryFg.enable();
          this.salaryHint.showError('Salary payment failed, try again.');
        }
      } catch {
        this.salaryFg.enable();
        this.salaryHint.showError('Salary payment failed, try again.');
      }
    })();
  }

  majorEC() {
    this.majorFg.disable();
    const v = this.majorFg.value;
    (async () => {
      try {
        const result = await this.backend.majorEC();
        if (result.ok) {
          this.majorHint.showMessage('The economy is now in ruins.');
          await this.updateData();
        } else {
          this.majorFg.enable();
          this.majorHint.showError('Action failed, try again.');
        }
      } catch {
        this.majorFg.enable();
          this.majorHint.showError('Action failed, try again.');
      }
    })();
  }

  getPIN() {
    this.pinToolFg.disable();
    this.showPIN = '';
    const v = this.pinToolFg.value;
    (async () => {
      try {
        const result = await this.backend.getPin(v.person.id);
        if (result.ok) {
          this.showPIN = result.body.pin;
          this.doPINAnim();
          this.pinToolForm.resetForm();
          this.pinToolFg.enable();
          await this.updateData();
        } else {
          this.pinToolFg.enable();
          // this.pinToolHint.showError('Action failed, try again.');
        }
      } catch {
        this.pinToolFg.enable();
          // this.pinToolHint.showError('Action failed, try again.');
      }
    })();
  }
}
