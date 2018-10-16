import { Component, OnInit, ViewChild } from '@angular/core';
import { WebappBackendService, Member, AccessLevel, Class } from '../webapp-backend.service';
import { FormBuilder, Validators } from '@angular/forms';
import { sortMembers } from '../util';
import { FadeHintComponent } from '../fade-hint/fade-hint.component';

@Component({
  selector: 'app-make-job-page',
  templateUrl: './make-job-page.component.html',
  styleUrls: ['./make-job-page.component.scss']
})
export class MakeJobPageComponent implements OnInit {
  public members: Member[];
  private quickAddList: Member[] = [];
  @ViewChild('hint') hint: FadeHintComponent;

  @ViewChild('form') form;
  fg = this.fb.group({
    name: ['', Validators.required],
    blueSalary: [0, Validators.required],
    orangeSalary: [0, Validators.required],
    toAdd: [null]
  });

  constructor(private backend: WebappBackendService, private fb: FormBuilder) { 
    this.fg.get('toAdd').valueChanges.subscribe(val => this.addMember(val));
  }

  ngOnInit() {
    this.members = null;
    this.quickAddList = [];
    this.backend.getCachedMemberList().then(e => this.members = sortMembers(e, true));
  }

  addMember(member: Member) {
    if (!member) return;
    if (this.quickAddList.indexOf(member) === -1) {
      this.quickAddList.push(member);
    }
    this.fg.get('toAdd').reset();
  }

  removeMember(member: Member) {
    this.quickAddList.splice(this.quickAddList.indexOf(member), 1);
  }

  submit() {
    const v = this.fg.value;
    this.fg.disable();
    (async () => {
      try {
        let res = await this.backend.createJob(v.name, v.blueSalary, v.orangeSalary);
        if (res.ok) {
          for (const member of this.quickAddList) {
            await this.backend.patchMember(member, {
              jobs: member.jobs.concat(res.body.id)
            });
          }
          this.quickAddList = [];
          this.form.resetForm();
          this.hint.showMessage('Job created!');
        } else {
          this.hint.showError('Error encountered while creating job.');
        }
      } catch {
        this.hint.showError('Error encountered while creating job.');
      }
      this.members = sortMembers(await this.backend.getCachedMemberList(), true);
      this.fg.enable();
    })();
  }
}
