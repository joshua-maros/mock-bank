import { Component, OnInit, Input } from '@angular/core';
import { Transaction, WebappBackendService } from '../webapp-backend.service';

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

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then((members) => {
      if (!this.transaction) {
        return;
      }
      for (const member of members) {
        if (member.id === this.transaction.from) {
          this.fromName = member.firstName + ' ' + member.lastName;
          if (member.firstName === '!') {
            this.fromName = 'Bank';
          } else {
            this.fromColor = member.blue ? 'blue' : 'orange';
          }
        } else if (member.id === this.transaction.to) {
          this.toName = member.firstName + ' ' + member.lastName;
          if (member.firstName === '!') {
            this.toName = 'Bank';
          } else {
            this.toColor = member.blue ? 'blue' : 'orange';
          }
        }
      }
    });
  }

  ngOnInit() { }
}
