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
    person: [null, Validators.required],
    confirm: [false, Validators.requiredTrue]
  });

  get oranges() {
    return this.members.filter(e => e.class === Class.ORANGE);
  }

  get richOranges() {
    return this.oranges.filter(e => e.currentWealth >= 550);
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

  constructor(private backend: WebappBackendService, private fb: FormBuilder) { }

  async updateData() {
    this.members = sortMembers(await this.backend.getCachedMemberList(), true);
  }

  ngOnInit() {
    this.updateData();
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
}
