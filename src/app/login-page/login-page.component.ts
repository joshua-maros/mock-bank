import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { WebappBackendService } from '../webapp-backend.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  fg = this.fb.group({
    first: ['', Validators.required],
    last: ['', Validators.required],
    pin: ['', Validators.required]
  });

  constructor(private fb: FormBuilder, private backend: WebappBackendService, private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit() { }

  async login() {
    if (this.fg.disabled) {
      return;
    }
    const v = this.fg.value;
    this.fg.disable();
    const result = await this.backend.login(v.first + ' ' + v.last, v.pin);
    if (result) {
      const returnUrl = this.route.snapshot.queryParamMap.get('url');
      this.router.navigateByUrl(returnUrl);
    }
    this.fg.enable();
   }
}
