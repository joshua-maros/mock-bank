import { Component, OnInit } from '@angular/core';
import { Member, WebappBackendService } from '../webapp-backend.service';
import { sortMembers } from '../util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-members-page',
  templateUrl: './members-page.component.html',
  styleUrls: ['./members-page.component.scss']
})
export class MembersPageComponent implements OnInit {
  members: Member[];

  constructor(private backend: WebappBackendService, private router: Router) {
    backend.getCachedMemberList().then(e => this.members = sortMembers(e, true));
  }

  gotoMember(member: Member) {
    this.router.navigateByUrl('/members/' + member.id);
  }

  ngOnInit() { }
}
