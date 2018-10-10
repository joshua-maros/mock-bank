import { PlatformIdService } from '../platform-id.service';
import { WebappBackendService, AccessLevel } from '../webapp-backend.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.scss']
})
export class TitleBarComponent implements OnInit {
  signedInButtons = [
    {text: 'People', url: '/members'}
  ];
  leaderButtons = [
    {text: 'Add Person', url: '/members/new'},
    {text: 'Create Transaction', url: '/transactions/new'}
  ];
  time = '00:00';
  flash = false;

  get AccessLevel() { // for *ngIf s
    return AccessLevel;
  }

  constructor(public backend: WebappBackendService, public platformId: PlatformIdService, private router: Router,
    private route: ActivatedRoute) {
    setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    const ss = this.backend.getSessionTime() / 1000;
    if (ss < 0) {
      this.time = '00:00';
      this.flash = true;
    } else {
      this.time = Math.floor(ss / 60).toString().padStart(2, '0') + ':' + Math.floor(ss % 60).toString().padStart(2, '0');
      this.flash = false;
    }
  }

  routeToLogin() {
    this.router.navigate(['/login'], {
      queryParams: {
        url: '/' + this.route.snapshot.routeConfig.path
      }
    });
  }

  ngOnInit() { }
}
