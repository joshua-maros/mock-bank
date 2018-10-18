import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Member, WebappBackendService, Class, MemberGroup } from '../webapp-backend.service';
import { sortMembers } from '../util';

@Component({
  selector: 'app-tools-page',
  templateUrl: './tools-page.component.html',
  styleUrls: ['./tools-page.component.scss']
})
export class ToolsPageComponent implements OnInit {
  public members: (Member | MemberGroup)[];

  public pinFg = this.fb.group({
    oldPin: [null, Validators.required],
    newPin: [null, Validators.required]
  });
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
}
