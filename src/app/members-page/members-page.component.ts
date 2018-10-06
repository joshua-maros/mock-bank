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
    backend.getCachedMemberList().then(e => this.members = e);
  }

  ngOnInit() { }
}
