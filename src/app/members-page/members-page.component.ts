import { Component, OnInit } from '@angular/core';
import { Member, WebappBackendService, MemberGroup, Class } from '../webapp-backend.service';
import { sortMembers, sortObjects, filterMembers } from '../util';
import { ItemKey, ItemKeyType, SortMode, SortKey } from '../sort-box/sort-box.component';

@Component({
  selector: 'app-members-page',
  templateUrl: './members-page.component.html',
  styleUrls: ['./members-page.component.scss']
})
export class MembersPageComponent implements OnInit {
  showSort = false;
  members: (Member | MemberGroup)[];
  sortedMembers: (Member | MemberGroup)[];
  memberFilterKeys: ItemKey[] = [
    new ItemKey('firstName', 'First Name', 'string'),
    new ItemKey('lastName', 'Last Name', 'string'),
    new ItemKey('currentWealth', 'Bank Balance', 'number'),
    new ItemKey('class', 'Social Class', [
      ['Blue', Class.BLUE],
      ['Orange', Class.ORANGE],
      ['Neutral', Class.NEUTRAL]
    ]),
  ];
  memberSortModes: SortMode[] = [
    new SortMode('First Name', [
      new SortKey('firstName', false),
      new SortKey('lastName', false),
    ], [
      new SortKey('firstName', true),
      new SortKey('lastName', true),
    ]),
    new SortMode('Last Name', [
      new SortKey('lastName', false),
      new SortKey('firstName', false),
    ], [
      new SortKey('lastName', true),
      new SortKey('firstName', true),
    ]),
    new SortMode('Bank Balance', [
      new SortKey('currentWealth', true),
      new SortKey('firstName', false),
      new SortKey('lastName', false),
    ], [
      new SortKey('currentWealth', false),
      new SortKey('firstName', false),
      new SortKey('lastName', false),
    ]),
  ];

  constructor(private backend: WebappBackendService) { }

  async updateData() {
    const members = this.backend.getCachedMemberList();
    const jobs = this.backend.getCachedJobList();
    const amembers = await members;
    for (const member of amembers) {
      member.salary = 0;
      for (const job of await jobs) {
        if (member.jobs.indexOf(job.id) !== -1) {
          member.salary += member.class === Class.BLUE ? job.blueSalary : job.orangeSalary;
        }
      }
    }
    this.members = amembers;
  }

  ngOnInit() {
    this.members = null;
    this.updateData();
  }
}
