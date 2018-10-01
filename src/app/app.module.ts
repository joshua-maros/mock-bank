import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatToolbarModule, MatIconModule, MatIconRegistry, MatMenuModule, MatRippleModule } from '@angular/material';

import { AppComponent } from './app.component';
import { WebappBackendService } from './webapp-backend.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatToolbarModule
  ],
  providers: [WebappBackendService, HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule { }
