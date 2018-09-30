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
  ownsDesks: number[];
  rentsDesks: number[];
  jobs: string[];
  startWealth: number;
  accessLevel: AccessLevel;
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

@Injectable()
export class WebappBackendService {
  private session: Session = null;

  public get currentMember(): Member {
    if (this.session) {
      return this.session.loggedInMember;
    } else {
      return null;
    }
  }

  constructor(private client: HttpClient/*, private cookieService: CookieService*/) {
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
    return this.session && this.session.loggedInMember && this.session.loggedInMember.accessLevel;
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

  createMember(memberData: Partial<Member>): Promise<HttpResponse<Member>> {
    return this.post<Member>('/api/v1/members', memberData);
  }

  getMemberList(): Promise<HttpResponse<Member[]>> {
    return this.get<Member[]>('/api/v1/members/list');
  }

  getTransactionHistory(): Promise<HttpResponse<Transaction[]>> {
    return this.get<Transaction[]>('/api/v1/ledger');
  }

  createTransaction(from: Member | string, to: Member | string, amount: number, reason: string) {
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
    });
  }
}
