import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators, NgForm } from '@angular/forms';
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

  get oranges() {
    return this.members.filter(e => e.class === Class.ORANGE);
  }

  get blues() {
    return this.members.filter(e => e.class === Class.BLUE);
  }

  constructor(private backend: WebappBackendService, private fb: FormBuilder) { }

  ngOnInit() {
    this.backend.getCachedMemberList().then(e => this.members = sortMembers(e, true));
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
        } else {
          this.rofHint.showError('Swap was not successful, try again.');
        }
      } catch {
          this.rofHint.showError('Swap was not successful, try again.');
      }
      this.rofFg.enable();
    })();
  }
}
