import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { WebappBackendService } from '../webapp-backend.service';
import { OverlayHintComponent } from '../overlay-hint/overlay-hint.component';

@Component({
  selector: 'app-make-member-page',
  templateUrl: './make-member-page.component.html',
  styleUrls: ['./make-member-page.component.scss']
})
export class MakeMemberPageComponent implements OnInit {
  @ViewChild('form') form;
  @ViewChild('message') message: OverlayHintComponent;
  messageTimeout;
  fg = this.fb.group({
    class: ['none', Validators.required],
    name: ['', (control: AbstractControl): {[key: string]: any} | null => {
      return control.value.split(' ').length === 2 ? null : {'names': 'not two'};
    }]
  });

  constructor(private fb: FormBuilder, private backend: WebappBackendService) { }

  ngOnInit() { }

  async submit() {
    this.fg.updateValueAndValidity();
    if (this.fg.disabled || !this.fg.valid) {
      return;
    }
    this.fg.disable();
    const names = this.fg.value.name.split(' ');
    const oldClass = this.fg.value.class;
    await this.backend.createMember({
      firstName: names[0],
      lastName: names[1],
      class: oldClass
    });
    this.form.resetForm();
    this.fg.patchValue({
      name: '',
      class: oldClass
    });
    this.fg.enable();
    this.message.showMessage('User created!');
  }
}
