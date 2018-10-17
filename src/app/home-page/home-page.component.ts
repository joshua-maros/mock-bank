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

  changePin() {
    const oldPin = window.prompt('Enter current PIN:');
    const newPin = window.prompt('Enter new PIN:');
    const confirm = window.prompt('Re-enter new PIN:') === newPin;
    if (!confirm) {
      window.alert('PINs do not match!');
      return;
    }
    this.backend.changePin(oldPin, newPin).then(e => {
      window.alert('PIN changed!');
    });
  }

  logout() {
    this.backend.logout();
  }
}
