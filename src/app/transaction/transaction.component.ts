import { Component, OnInit, Input } from '@angular/core';
import { Transaction, WebappBackendService } from '../webapp-backend.service';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {
  @Input() transaction: Transaction = null;
  private fromName = '';
  private toName = '';

  constructor(private backend: WebappBackendService) {
    backend.getCachedMemberList().then((members) => {
      if (!this.transaction) {
        return;
      }
      for (const member of members) {
        if (member.id === this.transaction.from) {
          this.fromName = member.firstName + ' ' + member.lastName;
        } else if (member.id === this.transaction.to) {
          this.toName = member.firstName + ' ' + member.lastName;
        }
      }
    });
  }

  ngOnInit() {
  }
}
