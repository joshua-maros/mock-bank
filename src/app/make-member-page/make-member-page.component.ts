import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { WebappBackendService } from '../webapp-backend.service';

@Component({
  selector: 'app-make-member-page',
  templateUrl: './make-member-page.component.html',
  styleUrls: ['./make-member-page.component.scss']
})
export class MakeMemberPageComponent implements OnInit {
  @ViewChild('form') form;
  @ViewChild('message') message;
  messageTimeout;
  fg = this.fb.group({
    name: ['', (control: AbstractControl): {[key: string]: any} | null => {
      return control.value.split(' ').length === 2 ? null : {'names': 'not two'};
    }]
  });

  constructor(private fb: FormBuilder, private backend: WebappBackendService) { }

  ngOnInit() { }

  showMessage() {
    this.message.nativeElement.classList.add('active');
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.messageTimeout = setTimeout(() => {
      this.message.nativeElement.classList.remove('active');
      this.messageTimeout = null;
    }, 1500);
  }

  async submit() {
    this.fg.updateValueAndValidity();
    if (this.fg.disabled || !this.fg.valid) {
      return;
    }
    this.fg.disable();
    const names = this.fg.value.name.split(' ');
    await this.backend.createMember({
      firstName: names[0],
      lastName: names[1]
    });
    this.form.resetForm();
    this.fg.patchValue({
      name: ''
    });
    this.fg.enable();
    this.showMessage();
  }
}
