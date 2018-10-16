import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { MatAutocompleteModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule,
  MatSelectModule, MatToolbarModule, MatIconModule, MatIconRegistry, MatMenuModule,
  MatRippleModule } from '@angular/material';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { WebappBackendService } from './webapp-backend.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PlatformIdService } from './platform-id.service';
import { TitleBarComponent } from './title-bar/title-bar.component';
import { TransactionPageComponent } from './transaction-page/transaction-page.component';
import { PageGuardComponent } from './page-guard/page-guard.component';
import { TransactionComponent } from './transaction/transaction.component';
import { CenteredLayoutComponent } from './centered-layout/centered-layout.component';
import { MakeTransactionPageComponent } from './make-transaction-page/make-transaction-page.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MakeMemberPageComponent } from './make-member-page/make-member-page.component';
import { MembersPageComponent } from './members-page/members-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { CookieService, CookieOptionsProvider, CookieModule } from 'ngx-cookie';
import { JobsPageComponent } from './jobs-page/jobs-page.component';
import { MakeJobPageComponent } from './make-job-page/make-job-page.component';
import { JobComponent } from './job/job.component';
import { MemberPageComponent } from './member-page/member-page.component';
import { MemberComponent } from './member/member.component';
import { JobPageComponent } from './job-page/job-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { ClearBoxComponent } from './clear-box/clear-box.component';
import { FadeHintComponent } from './fade-hint/fade-hint.component';

const appRoutes = [
  { path: 'home', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'transactions', component: TransactionPageComponent },
  { path: 'transactions/new', component: MakeTransactionPageComponent },
  { path: 'members', component: MembersPageComponent },
  { path: 'members/new', component: MakeMemberPageComponent },
  { path: 'members/:id', component: MemberPageComponent },
  { path: 'jobs', component: JobsPageComponent },
  { path: 'jobs/new', component: MakeJobPageComponent },
  { path: 'jobs/:id', component: JobPageComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    TitleBarComponent,
    TransactionPageComponent,
    PageGuardComponent,
    TransactionComponent,
    CenteredLayoutComponent,
    MakeTransactionPageComponent,
    MakeMemberPageComponent,
    MembersPageComponent,
    LoginPageComponent,
    JobsPageComponent,
    MakeJobPageComponent,
    JobComponent,
    MemberPageComponent,
    MemberComponent,
    JobPageComponent,
    HomePageComponent,
    ClearBoxComponent,
    FadeHintComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CookieModule.forRoot(),
    FormsModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatToolbarModule,
    ReactiveFormsModule,
    RouterModule.forRoot(appRoutes, { enableTracing: false })
  ],
  providers: [
    WebappBackendService,
    HttpClient,
    PlatformIdService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(reg: MatIconRegistry, domSanitizer: DomSanitizer) {
    reg.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('./assets/mdi.svg'));
  }
}
