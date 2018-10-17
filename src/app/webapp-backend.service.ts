import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { CookieService } from 'ngx-cookie';

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export enum AccessLevel {
  VISITOR = 'visitor',
  MEMBER = 'member',
  LEADER = 'leader'
}

export enum Class {
  BLUE = 'blue',
  ORANGE = 'orange',
  NEUTRAL = 'none'
}

export interface Member {
  id: string;
  pin?: string;
  firstName: string;
  lastName: string;
  class: Class;
  ownsDesks: number[];
  rentsDesks: number[];
  jobs: string[];
  accessLevel: AccessLevel;
  currentWealth: number;
}

export interface Session {
  sessionToken: string;
  expires: number;
  loggedInMember: Member;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  reason: string;
}

export interface Job {
  id: string;
  title: string;
  blueSalary: number;
  orangeSalary: number;
}

const quantifiedAccessLevels = {
  visitor: 0,
  member: 2,
  leader: 3
};

export function quantifyAccessLevel(level: AccessLevel) {
  return quantifiedAccessLevels[level];
}

interface BackendHTTPOptions {
  headers: {
    'content-type'?: string,
    authorization: string
  };
  observe: 'response';
  responseType: 'json';
  params?: HttpParams;
}

const CACHE_EXPIRE_TIME = 1000 * 60; // Expire after one minute.

export class CachedResource<T> {
  private data: T;
  private lastRefresh = 0;
  private currentUpdate: Promise<T>;
  private currentUpdateComplete = true;
  private hold: Promise<void> = null;
  private endHoldFunc: () => any;

  public constructor(private refresher: () => Promise<HttpResponse<T>>, placeholder: T) {
    this.data = placeholder;
  }
  public async get() {
    if (Date.now() < this.lastRefresh + CACHE_EXPIRE_TIME) {
      return this.data;
    } else {
      if (this.hold) {
        await this.hold;
        this.hold = null;
      }
      if (this.currentUpdateComplete) {
        this.currentUpdateComplete = false;
        this.currentUpdate = new Promise<T>(async (res, rej) => {
          try { // Only update the last refresh date if data is sucessfully retreived.
            this.data = (await this.refresher()).body;
            this.lastRefresh = Date.now();
          } catch { }
          this.currentUpdateComplete = true;
          res(this.data);
        });
      }
      return this.currentUpdate;
    }
  }
  public markDirty() {
    this.lastRefresh = 0;
  }
  public markDirtyAndHold() {
    this.markDirty();
    this.hold = new Promise((res, rej) => this.endHoldFunc = res);
  }
  public endHold() {
    if (this.hold) {
      this.endHoldFunc();
    }
  }
}

@Injectable()
export class WebappBackendService {
  private session: Session = null;
  private cachedMembers: CachedResource<Member[]>;
  private cachedLedger: CachedResource<Transaction[]>;
  private cachedJobs: CachedResource<Job[]>;

  public get currentMember(): Member {
    if (this.session) {
      return this.session.loggedInMember;
    } else {
      return null;
    }
  }

  constructor(private client: HttpClient, private cookieService: CookieService) {
    this.cachedMembers = new CachedResource<Member[]>(() => this.get<Member[]>('/api/v1/members'), []);
    this.cachedLedger = new CachedResource<Transaction[]>(() => this.get<Transaction[]>('/api/v1/ledger'), []);
    this.cachedJobs = new CachedResource<Job[]>(() => this.get<Job[]>('/api/v1/jobs'), []);
    if (this.cookieService.get('sessionToken')) {
      this.session = {
        sessionToken: this.cookieService.get('sessionToken'),
        expires: Date.now() + 1000 * 60,
        loggedInMember: null
      };
      this.get<Session>('/api/v1/session/isValid').then((res) => {
        if (res.ok) {
          this.session = res.body;
        } else {
          this.session = null;
        }
      }, (err) => {
        this.session = null;
      });
    }
  }

  private createOptions(contentType?: string): BackendHTTPOptions {
    const headers = { authorization: '' };
    if (contentType) {
      headers['content-type'] = contentType;
    }
    if (this.isSessionValid()) {
      headers.authorization = 'Bearer ' + this.session.sessionToken;
    }
    return {
      observe: <'response'> 'response',
      headers: headers,
      responseType: <'json'> 'json'
    };
  }

  private patch<T>(url: string, data: any): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const options = this.createOptions('application/merge-patch+json');
      this.client.patch<T>(url, data, options).subscribe(resolve, reject);
    });
  }

  private post<T>(url: string, data: any): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const options = this.createOptions('application/json');
      this.client.post<T>(url, data, options).subscribe(resolve, reject);
    });
  }

  private get<T>(url: string): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const options = this.createOptions();
      const it = this.client.get<T>(url, options);
      it.subscribe(resolve, reject);
    });
  }

  private delete<T>(url: string): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const options = this.createOptions();
      this.client.delete<T>(url, options).subscribe(resolve, reject);
    });
  }

  private getByQuery<T>(url: string, query: any): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const options = this.createOptions();
      let params = new HttpParams();
      for (const key of Object.keys(query)) {
        params = params.append(key, query[key]);
      }
      options.params = params;
      const it = this.client.get<T>(url, options);
      it.subscribe(resolve, reject);
    });
  }

  getSessionToken(): string {
    return this.session && this.session.sessionToken;
  }

  doesSessionExist(): boolean {
    return !!this.session;
  }

  getSessionTime(): number {
    return this.session ? this.session.expires - Date.now() : 0;
  }

  isSessionValid(): boolean {
    return this.session && this.session.expires > Date.now();
  }

  getCurrentMember(): Member {
    return this.session && this.session.loggedInMember;
  }

  getAccessLevel(): AccessLevel {
    return this.session && this.session.loggedInMember && this.session.loggedInMember.accessLevel || AccessLevel.VISITOR;
  }

  shouldHaveAccess(minimumRequired: AccessLevel) {
    return quantifyAccessLevel(this.getAccessLevel()) >= quantifyAccessLevel(minimumRequired);
  }

  async login(name: string, pin: string) {
    try {
      const result = await this.getByQuery<Session>('/api/v1/session/login', { name: name, pin: pin });
      if (result.status === 200) {
        this.session = result.body;
        this.cookieService.put('sessionToken', this.session.sessionToken);
      }
      return result;
    } catch {
      return false;
    }
  }

  logout() {
    this.session = null;
    this.cookieService.remove('sessionToken');
  }

  getCachedMemberList(): Promise<Member[]> {
    return this.cachedMembers.get();
  }

  createMember(memberData: Partial<Member>): Promise<HttpResponse<Member>> {
    this.cachedMembers.markDirtyAndHold();
    return this.post<Member>('/api/v1/members', memberData).then((e) => {
      this.cachedMembers.endHold();
      return e;
    });
  }

  patchMember(member: Member | string, memberData: Partial<Member>): Promise<HttpResponse<Member>> {
    this.cachedMembers.markDirtyAndHold();
    if ((member as Member).id !== undefined) {
      member = (member as Member).id;
    }
    return this.patch<Member>('/api/v1/members/' + member, memberData).then((e) => {
      this.cachedMembers.endHold();
      return e;
    });
  }

  changePin(from: string, to: string): Promise<HttpResponse<{}>> {
    return this.post<{}>('/api/v1/members/' + this.getCurrentMember().id + '/pin', {
      oldPin: from,
      newPin: to
    });
  }

  async getClassSummary(clas: Class, hrClassName: string): Promise<Member> {
    let minBalance = 99999999;
    for (const member of await this.getCachedMemberList()) {
      if (member.class === clas && member.currentWealth < minBalance) {
        minBalance = member.currentWealth;
      }
    }
    return {
      accessLevel: AccessLevel.MEMBER,
      class: clas,
      firstName: 'All',
      lastName: hrClassName,
      id: 'ALL_' + hrClassName.toUpperCase(),
      currentWealth: minBalance,
      jobs: [],
      ownsDesks: [],
      rentsDesks: []
    };
  }

  getCachedLedger(): Promise<Transaction[]> {
    return this.cachedLedger.get();
  }

  createTransaction(from: Member | string, to: Member | string, amount: number, reason: string) {
    this.cachedLedger.markDirtyAndHold();
    this.cachedMembers.markDirtyAndHold(); // Because the server will recalculate individual balances afterwards.
    if ((from as Member).id !== undefined) {
      from = (from as Member).id;
    }
    if ((to as Member).id !== undefined) {
      to = (to as Member).id;
    }
    return this.post<Transaction>('/api/v1/ledger', {
      from: from,
      to: to,
      amount: amount,
      reason: reason
    }).then((e) => {
      this.cachedLedger.endHold();
      this.cachedMembers.endHold();
      return e;
    });
  }

  paySalaries(): Promise<HttpResponse<null>> {
    return this.post('/api/v1/ledger/paySalaries', {});
  }

  getCachedJobList(): Promise<Job[]> {
    return this.cachedJobs.get();
  }

  createJob(title: string, blueSalary: number, orangeSalary: number): Promise<HttpResponse<Job>> {
    this.cachedJobs.markDirtyAndHold();
    return this.post<Job>('/api/v1/jobs', {
      title: title,
      blueSalary: blueSalary,
      orangeSalary: orangeSalary
    }).then((e) => {
      this.cachedJobs.endHold();
      return e;
    });
  }

  deleteJob(job: Job | string) {
    if ((job as Job).id !== undefined) {
      job = (job as Job).id;
    }
    return this.delete<{}>('/api/v1/jobs/' + job);
  }
}
