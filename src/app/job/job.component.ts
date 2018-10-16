import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Job } from '../webapp-backend.service';
import { OuterSubscriber } from 'rxjs/internal/OuterSubscriber';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent implements OnInit {
  @Input() job: Job;
  @Input() showDelete = false;
  @Output() deleteClick = new EventEmitter<void>();

  constructor() { }

  ngOnInit() { }
}
