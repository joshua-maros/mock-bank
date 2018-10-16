import { Component, OnInit, Input } from '@angular/core';
import { Member, WebappBackendService } from '../webapp-backend.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss']
})
export class MemberComponent implements OnInit {
  @Input() member: Member = null;
  salary: Number = null;

  constructor(private backend: WebappBackendService, private router: Router) { }

  ngOnInit() {
    this.backend.getCachedJobList().then(jobs => {
      let total = 0;
      for (const job of jobs) {
        if (this.member.jobs.indexOf(job.id) !== -1) {
          total += this.member.class === 'blue' ? job.blueSalary : job.orangeSalary;
        }
      }
      this.salary = total;
    });
  }

  gotoMember() {
    this.router.navigateByUrl('/members/' + this.member.id);
  }
}
