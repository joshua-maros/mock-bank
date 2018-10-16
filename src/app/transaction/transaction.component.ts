import { Component, OnInit, Input } from '@angular/core';
import { Transaction, WebappBackendService } from '../webapp-backend.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {
  @Input() transaction: Transaction = null;
  fromName = '';
  toName = '';
  fromColor = '';
  toColor = '';

  constructor(private backend: WebappBackendService, private router: Router) {
    backend.getCachedMemberList().then((members) => {
      if (!this.transaction) {
        return;
      }
      for (const member of members) {
        if (member.id === this.transaction.from) {
          this.fromName = member.firstName + ' ' + member.lastName;
          if (member.firstName === '!') {
            this.fromName = member.lastName;
          } else {
            this.fromColor = member.class;
          }
        } else if (member.id === this.transaction.to) {
          this.toName = member.firstName + ' ' + member.lastName;
          if (member.firstName === '!') {
            this.toName = member.lastName;
          } else {
            this.toColor = member.class;
          }
        }
      }
    });
  }

  gotoFrom() {
    this.router.navigateByUrl('/members/' + this.transaction.from);
  }

  gotoTo() {
    this.router.navigateByUrl('/members/' + this.transaction.to);
  }

  ngOnInit() { }
}
