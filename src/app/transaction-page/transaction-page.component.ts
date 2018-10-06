import { Component, OnInit } from '@angular/core';
import { AccessLevel, Member, Transaction, WebappBackendService } from '../webapp-backend.service';

@Component({
  selector: 'app-transaction-page',
  templateUrl: './transaction-page.component.html',
  styleUrls: ['./transaction-page.component.scss']
})
export class TransactionPageComponent implements OnInit {
  members: Member[];
  ledger: Transaction[];

  get AccessLevel() { // For *ngIfs
    return AccessLevel;
  }

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then(e => this.members = e);
    backend.getCachedLedger().then(e => this.ledger = e);
  }

  ngOnInit() {
  }
}
