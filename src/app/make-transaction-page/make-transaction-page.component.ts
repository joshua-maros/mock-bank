import { Component, OnInit } from '@angular/core';
import { WebappBackendService, Member, AccessLevel } from '../webapp-backend.service';

@Component({
  selector: 'app-make-transaction-page',
  templateUrl: './make-transaction-page.component.html',
  styleUrls: ['./make-transaction-page.component.scss']
})
export class MakeTransactionPageComponent implements OnInit {
  private members: Member[];

  get AccessLevel() { // For *ngIfs
    return AccessLevel;
  }

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then(e => this.members = e);
  }

  ngOnInit() { }
}
