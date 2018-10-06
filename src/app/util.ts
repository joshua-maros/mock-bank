import { Member } from './webapp-backend.service';

export function sortMembers(input: Member[], excludeBank: boolean): Member[] {
    const sorted = input.sort((a, b) => {
      if (a.firstName === b.firstName) {
        return (a.lastName > b.lastName ? -1 : 1);
      } else {
        return (a.firstName > b.firstName ? -1 : 1);
      }
    });
    if (excludeBank) {
        return sorted.filter(e => e.firstName !== '!');
    } else {
        return sorted;
    }
}
