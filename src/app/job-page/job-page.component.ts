import { Component, OnInit } from '@angular/core';
import { WebappBackendService, Job, Member, MemberGroup } from '../webapp-backend.service';
import { ActivatedRoute } from '@angular/router';
import { sortMembers } from '../util';

@Component({
  selector: 'app-job-page',
  templateUrl: './job-page.component.html',
  styleUrls: ['./job-page.component.scss']
})
export class JobPageComponent implements OnInit {
  public job: Job = null;
  public members: (Member | MemberGroup)[] = null;
  public employees: Member[] = null;

  get isLeader() {
    return this.backend.getAccessLevel() === 'leader';
  }

  private async updateEmployeeList() {
    const members = await this.backend.getCachedMemberList();
    this.members = sortMembers(members, true);
    this.employees = [];
    for (const member of members) {
      if (member.jobs.indexOf(this.job.id) !== -1) {
        this.employees.push(member);
      }
    }
  }

  constructor(private backend: WebappBackendService, private route: ActivatedRoute) {
    this.route.params.subscribe(async params => {
      const id = params['id'];
      const jobs = await this.backend.getCachedJobList();
      for (const job of jobs) {
        if (job.id === id) {
          this.job = job;
          break;
        }
      }
      this.updateEmployeeList();
    });
  }

  ngOnInit() { }

  async addEmployee(employee: Member) {
    if (employee.jobs.indexOf(this.job.id) !== -1) {
      return;
    }
    this.employees.push(employee);
    await this.backend.patchMember(employee, {
      jobs: employee.jobs.concat(this.job.id)
    });
    await this.updateEmployeeList();
  }

  async fireEmployee(employee: Member) {
    if (employee.jobs.indexOf(this.job.id) === -1) {
      return;
    }
    this.employees = this.employees.filter(member => member.id !== employee.id);
    await this.backend.patchMember(employee, {
      jobs: employee.jobs.filter(jobId => jobId !== this.job.id)
    });
    await this.updateEmployeeList();
  }
}
