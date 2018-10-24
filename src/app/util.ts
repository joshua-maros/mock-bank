import { Member, Job, MemberGroup } from './webapp-backend.service';

export function sortMembers(input: (Member | MemberGroup)[], excludeBank: boolean): (Member | MemberGroup)[] {
  const sorted = input.sort((a, b) => {
    if (a.firstName.toLowerCase() === b.firstName.toLowerCase()) {
      return (a.lastName.toLowerCase() > b.lastName.toLowerCase() ? 1 : -1);
    } else {
      return (a.firstName.toLowerCase() > b.firstName.toLowerCase() ? 1 : -1);
    }
  });
  if (excludeBank) {
    return sorted.filter(e => e.firstName !== '!' || e.lastName !== 'Bank');
  } else {
    return sorted;
  }
}

export function sortObjects<T>(input: T[], rules: {key: string, reverse: boolean}[]): T[] {
  return input.sort((a, b) => {
    for (const rule of rules) {
      const ak = a[rule.key], bk = b[rule.key];
      if (ak === bk) {
        continue;
      }
      if (typeof(ak) === typeof('') || typeof(bk) === typeof('')) {
        return ((ak as string).toLowerCase() > (bk as string).toLowerCase() ? 1 : -1) * (rule.reverse ? -1 : 1);
      } else {
        return (ak as number) - (bk as number);
      }
    }
  });
}

export enum FilterMode {
  LESS_THAN,
  EQUAL,
  GREATER_THAN,
  NOT_EQUAL,
  CONTAINS,
  NOT_CONTAINS
}

export class FilterRule {
  constructor(public readonly key: string, public readonly value: any, public readonly mode: FilterMode) { }
}

export function filterObjects<T>(input: T[], rules: FilterRule[]) {
  return input.filter(x => {
    for (const rule of rules) {
      if (!x[rule.key]) {
        return false;
      }
      let v = rule.value;
      let xv = x[rule.key];
      if (typeof(xv) === typeof('')) {
        v = ('' + v).toLowerCase();
        xv = (xv as string).toLowerCase();
      }
      if (rule.mode === FilterMode.EQUAL && xv !== v) {
        return false;
      }
      if (rule.mode === FilterMode.NOT_EQUAL && xv === v) {
        return false;
      }
      if (rule.mode === FilterMode.LESS_THAN && xv >= v) {
        return false;
      }
      if (rule.mode === FilterMode.GREATER_THAN && xv <= v) {
        return false;
      }
      if (rule.mode === FilterMode.CONTAINS && (xv as string).indexOf(v as string) === -1) {
        return false;
      }
      if (rule.mode === FilterMode.NOT_CONTAINS && (xv as string).indexOf(v as string) !== -1) {
        return false;
      }
    }
    return true;
  });
}

export function filterMembers(input: (Member | MemberGroup)[], excludeBank: boolean, excludeEmpties: boolean)
  : (Member | MemberGroup)[] {
  return input.filter(e => {
    let include = true;
    if (excludeBank) {
      if (e.firstName === '!' && e.lastName === 'Bank') {
        include = false;
      }
    }
    if (excludeEmpties && e.currentWealth === 0) {
      include = false;
    }
    return include;
  });
}

export function sortJobs(input: Job[]): Job[] {
  return input.sort((a, b) => {
    return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
  });
}
