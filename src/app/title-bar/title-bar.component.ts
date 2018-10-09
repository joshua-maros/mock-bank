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
    {text: 'Info', url: '/private/contact'},
    {text: 'Members', url: '/private/members'},
    {text: 'My Profile', url: '/private/members/me'}
  ];
  leaderButtons = [
    {text: 'Part Requests [WIP]', url: '/private/parts'},
    {text: 'Roles', url: '/private/roles'}
  ];

  get AccessLevel() { // for *ngIf s
    return AccessLevel;
  }

  constructor(public backend: WebappBackendService, public platformId: PlatformIdService, private router: Router,
    private route: ActivatedRoute) { }

  routeToLogin() {
    this.router.navigate(['/login'], {
      queryParams: {
        url: '/' + this.route.snapshot.routeConfig.path
      }
    });
  }

  ngOnInit() { }
}
