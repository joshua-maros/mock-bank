import { Component, OnInit, ViewChild } from '@angular/core';
import { Member, Transaction, WebappBackendService, Job, Class, AccessLevel } from '../webapp-backend.service';
import { ActivatedRoute } from '@angular/router';
import { MatSelect } from '@angular/material';

@Component({
  selector: 'app-member-page',
  templateUrl: './member-page.component.html',
  styleUrls: ['./member-page.component.scss']
})
export class MemberPageComponent implements OnInit {
  members: Member[];
  ledger: Transaction[];
  jobs: Job[];
  thisMember: Member;
  thisMemberId: string;

  get memberJobs() {
    return this.jobs.filter(value => {
      return this.thisMember.jobs.indexOf(value.id) !== -1;
    });
  }

  get memberTransactions() {
    return this.ledger.filter(value => {
      return value.to === this.thisMember.id || value.from === this.thisMember.id;
    });
  }

  get isLeader() {
    return this.backend.getAccessLevel() === 'leader';
  }

  get salary() {
    let total = 0;
    for (const job of this.memberJobs) {
      if (this.thisMember.class === Class.ORANGE) {
        total += job.orangeSalary;
      } else {
        total += job.blueSalary;
      }
    }
    return total;
  }

  get accessLevel() {
    if (this.backend.isSessionValid()) {
      if (this.backend.getCurrentMember().id === this.thisMemberId) {
        return AccessLevel.MEMBER;
      } else {
        return AccessLevel.LEADER;
      }
    } else {
      return AccessLevel.MEMBER;
    }
  }

  private async reloadData() {
    const members = this.backend.getCachedMemberList();
    const ledger = this.backend.getCachedLedger();
    const jobs = this.backend.getCachedJobList();
    this.members = await members;
    this.ledger = await ledger;
    this.jobs = await jobs;
  }

  private updateThisMember() {
    for (const member of this.members) {
      if (member.id === this.thisMemberId) {
        this.thisMember = member;
        return;
      }
    }
  }

  constructor(private backend: WebappBackendService, private route: ActivatedRoute) {
    (async () => {
      await this.reloadData();
      this.route.params.subscribe(params => {
        this.thisMemberId = params['id'] === 'me' ? backend.getCurrentMember().id : params['id'];
        console.log(this.thisMemberId, backend.getCurrentMember().id);
        this.updateThisMember();
      });
    })();
  }

  addJob(job: Job) {
    if (!job || this.thisMember.jobs.indexOf(job.id) !== -1) {
      return;
    }
    const newJobList = this.thisMember.jobs.concat(job.id);
    this.thisMember.jobs = newJobList;
    this.backend.patchMember(this.thisMember, {
      jobs: newJobList
    });
    (async () => {
      this.members = await(this.backend.getCachedMemberList());
      this.updateThisMember();
    })();
  }

  deleteJob(job: Job) {
    this.thisMember.jobs = this.thisMember.jobs.filter(id => id !== job.id);
    const newJobList = this.memberJobs.filter(item => item.id !== job.id).map(item => item.id);
    this.backend.patchMember(this.thisMember, {
      jobs: newJobList
    });
    (async () => {
      this.members = await(this.backend.getCachedMemberList());
      this.updateThisMember();
    })();
  }

  test() {
    console.log('asdf');
  }

  ngOnInit() { }
}
