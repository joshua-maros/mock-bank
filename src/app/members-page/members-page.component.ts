import { Component, OnInit } from '@angular/core';
import { Member, WebappBackendService, MemberGroup } from '../webapp-backend.service';
import { sortMembers } from '../util';

@Component({
  selector: 'app-members-page',
  templateUrl: './members-page.component.html',
  styleUrls: ['./members-page.component.scss']
})
export class MembersPageComponent implements OnInit {
  members: (Member | MemberGroup)[];

  constructor(private backend: WebappBackendService) { }

  ngOnInit() {
    this.members = null;
    this.backend.getCachedMemberList().then(e => this.members = sortMembers(e, true));
  }
}
