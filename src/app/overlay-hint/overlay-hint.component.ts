import { Component, OnInit, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-overlay-hint',
  templateUrl: './overlay-hint.component.html',
  styleUrls: ['./overlay-hint.component.scss']
})
export class OverlayHintComponent implements OnInit {
  @Input('ms-per-word') msPerWord: number = 300;
  @Input('base-delay') baseDelay: number = 500;
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
    const numWords = this.text.split(' ').length;
    this.messageTimeout = setTimeout(() => {
      this.cssClassActive = false;
      this.messageTimeout = null;
    }, this.baseDelay + this.msPerWord * numWords);
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
