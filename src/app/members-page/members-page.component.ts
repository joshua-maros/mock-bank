import { Component, OnInit } from '@angular/core';
import { Member, WebappBackendService } from '../webapp-backend.service';

@Component({
  selector: 'app-members-page',
  templateUrl: './members-page.component.html',
  styleUrls: ['./members-page.component.scss']
})
export class MembersPageComponent implements OnInit {
  members: Member[];

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then(e => this.members = e.sort((a, b) => {
      if (a.firstName === b.firstName) {
        return (a.lastName > b.lastName ? -1 : 1);
      } else {
        return (a.firstName > b.firstName ? -1 : 1);
      }
    }).filter(f => f.firstName !== '!'));
  }

  ngOnInit() { }
}
