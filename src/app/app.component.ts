import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { WebappBackendService } from './webapp-backend.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'extensive-versatile-investment-log';

  constructor(private backend: WebappBackendService, private reg: MatIconRegistry, private domSanitizer: DomSanitizer) {
    reg.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('/assets/mdi.svg'));
  }
}
