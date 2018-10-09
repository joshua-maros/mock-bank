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
