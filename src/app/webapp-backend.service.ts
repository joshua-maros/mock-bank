import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
// import { CookieService } from 'ngx-cookie';

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export enum AccessLevel {
  VISITOR = 'visitor',
  MEMBER = 'member',
  LEADER = 'leader'
}

export interface Member {
  id: string;
  pin: string;
  firstName: string;
  lastName: string;
  blue: boolean;
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

  public constructor(private refresher: () => Promise<HttpResponse<T>>) { }
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
          this.data = (await this.refresher()).body;
          this.currentUpdateComplete = true;
          this.lastRefresh = Date.now();
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

  public get currentMember(): Member {
    if (this.session) {
      return this.session.loggedInMember;
    } else {
      return null;
    }
  }

  constructor(private client: HttpClient/*, private cookieService: CookieService*/) {
    this.cachedMembers = new CachedResource<Member[]>(() => this.get<Member[]>('/api/v1/members'));
    this.cachedLedger = new CachedResource<Transaction[]>(() => this.get<Transaction[]>('/api/v1/ledger'));
  }

  private createOptions(contentType?: string): BackendHTTPOptions {
    const headers = { authorization: '' };
    if (contentType) {
      headers['content-type'] = contentType;
    }
    if (this.session) {
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

  private getByQuery<T>(url: string, query: any): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const options = this.createOptions();
      let params = new HttpParams();
      for (const key of Object.keys(query)) {
        params = params.append(key, query[key]);
      }
      options.params = params;
      console.log(options.params);
      const it = this.client.get<T>(url, options);
      it.subscribe(resolve, reject);
    });
  }

  getSessionToken(): string {
    return this.session && this.session.sessionToken;
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

  login(name: string, pin: string) {
    const p = this.getByQuery<Session>('/api/v1/session/login', { name: name, pin: pin });
    return p.then((result) => {
      if (result.status === 200) {
        this.session = result.body;
      }
      return result;
    });
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
}
