import { Component, OnInit } from '@angular/core';
import { Job, WebappBackendService, AccessLevel } from '../webapp-backend.service';
import { sortJobs } from '../util';

@Component({
  selector: 'app-jobs-page',
  templateUrl: './jobs-page.component.html',
  styleUrls: ['./jobs-page.component.scss']
})
export class JobsPageComponent implements OnInit {
  jobs: Job[];

  get isLeader() {
    return this.backend.getAccessLevel() === AccessLevel.LEADER;
  }

  constructor(private backend: WebappBackendService) { }

  ngOnInit() {
    this.jobs = null;
    this.backend.getCachedJobList().then(e => this.jobs = sortJobs(e));
  }

  deleteJob(job: Job) {
    this.backend.deleteJob(job);
    this.jobs.splice(this.jobs.findIndex(i => i.id === job.id), 1);
    this.backend.getCachedJobList().then(e => this.jobs = e);
  }
}
