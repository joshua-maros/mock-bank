import { Component, OnInit, ViewChild } from '@angular/core';
import { WebappBackendService } from '../webapp-backend.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-make-job-page',
  templateUrl: './make-job-page.component.html',
  styleUrls: ['./make-job-page.component.scss']
})
export class MakeJobPageComponent implements OnInit {
  @ViewChild('form') form;
  fg = this.fb.group({
    name: ['', Validators.required],
    blueSalary: [0, Validators.required],
    orangeSalary: [0, Validators.required]
  });

  constructor(private backend: WebappBackendService, private fb: FormBuilder) { }

  ngOnInit() { }
}
