import { Component, OnInit } from '@angular/core';
import { Member, Transaction, WebappBackendService, Job, Class } from '../webapp-backend.service';
import { ActivatedRoute } from '@angular/router';

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

  constructor(private backend: WebappBackendService, private route: ActivatedRoute) {
    (async () => {
      const members = this.backend.getCachedMemberList();
      const ledger = this.backend.getCachedLedger();
      const jobs = this.backend.getCachedJobList();
      this.members = await members;
      this.ledger = await ledger;
      this.jobs = await jobs;
      this.route.params.subscribe(params => {
        for (const member of this.members) {
          if (member.id === params['id']) {
            this.thisMember = member;
          }
        }
      });
    })();
  }

  ngOnInit() { }
}
