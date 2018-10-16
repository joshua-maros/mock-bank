import { Component, OnInit } from '@angular/core';
import { WebappBackendService, AccessLevel } from '../webapp-backend.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  get showLeader() {
    return this.backend.isSessionValid() && this.backend.getAccessLevel() === AccessLevel.LEADER;
  }

  get loggedIn() {
    return this.backend.isSessionValid();
  }

  constructor(private backend: WebappBackendService) { }

  ngOnInit() { }

  paySalaries() {
    this.backend.paySalaries();
  }

  logout() {
    this.backend.logout();
  }
}
