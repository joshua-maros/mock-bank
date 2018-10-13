import { Component, OnInit } from '@angular/core';
import { Job, WebappBackendService } from '../webapp-backend.service';
import { sortJobs } from '../util';

@Component({
  selector: 'app-jobs-page',
  templateUrl: './jobs-page.component.html',
  styleUrls: ['./jobs-page.component.scss']
})
export class JobsPageComponent implements OnInit {
  jobs: Job[];

  constructor(private backend: WebappBackendService) {
    this.backend.getCachedJobList().then(e => this.jobs = sortJobs(e));
  }

  ngOnInit() { }
}
