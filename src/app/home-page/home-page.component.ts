import { Component, OnInit } from '@angular/core';
import { WebappBackendService, AccessLevel } from '../webapp-backend.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  constructor(private backend: WebappBackendService) { }

  ngOnInit() { }
}
