import { Component, OnInit, HostBinding, ViewChild, Input } from '@angular/core';

@Component({
  selector: 'app-fade-hint',
  templateUrl: './fade-hint.component.html',
  styleUrls: ['./fade-hint.component.scss']
})
export class FadeHintComponent implements OnInit {
  @Input('duration') duration: number = 1500;
  @HostBinding('class.active') cssClassActive: boolean = false;
  @HostBinding('class.error') cssClassError: boolean = false;
  text: string = 'Placeholder';
  messageTimeout;

  constructor() { }

  ngOnInit() { }

  private animateMessage() {
    this.cssClassActive = true;
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.messageTimeout = setTimeout(() => {
      this.cssClassActive = false;
      this.messageTimeout = null;
    }, this.duration);
  }

  public showMessage(message: string) {
    this.text = message;
    this.cssClassError = false;
    this.animateMessage();
  }

  public showError(error: string) {
    this.text = error;
    this.cssClassError = true;
    this.animateMessage();
  }
}
