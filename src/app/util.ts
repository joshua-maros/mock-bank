import { Member } from './webapp-backend.service';

export function sortMembers(input: Member[], excludeBank: boolean): Member[] {
  const sorted = input.sort((a, b) => {
    if (a.firstName.toLowerCase() === b.firstName.toLowerCase()) {
      return (a.lastName.toLowerCase() > b.lastName.toLowerCase() ? 1 : -1);
    } else {
      return (a.firstName.toLowerCase() > b.firstName.toLowerCase() ? 1 : -1);
    }
  });
  if (excludeBank) {
    return sorted.filter(e => e.firstName !== '!');
  } else {
    return sorted;
  }
}
