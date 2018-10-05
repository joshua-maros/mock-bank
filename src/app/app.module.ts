import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatToolbarModule, MatIconModule, MatIconRegistry, MatMenuModule, MatRippleModule } from '@angular/material';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { WebappBackendService } from './webapp-backend.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PlatformIdService } from './platform-id.service';
import { TitleBarComponent } from './title-bar/title-bar.component';
import { TransactionPageComponent } from './transaction-page/transaction-page.component';
import { PageGuardComponent } from './page-guard/page-guard.component';
import { TransactionComponent } from './transaction/transaction.component';

const appRoutes = [
  { path: 'transactions', component: TransactionPageComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    TitleBarComponent,
    TransactionPageComponent,
    PageGuardComponent,
    TransactionComponent
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
    MatToolbarModule,
    RouterModule.forRoot(appRoutes, { enableTracing: false })
  ],
  providers: [
    WebappBackendService,
    HttpClient,
    PlatformIdService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
