import { Component, OnInit } from '@angular/core';

class ChangelogEntry {
  constructor(public readonly versionNumber: string, public readonly changes: string[]) { }
}

@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.scss']
})
export class ChangelogComponent implements OnInit {
  public readonly entries = [
    new ChangelogEntry('v0.3', [
      `Added the 'Tools' page, which has various useful utilities.`,
      `You can now change your PIN on the 'Tools' page.`,
      `You can now do Reversal of Fortune on the 'Tools' page.`,
      `You can now promote an orange to a blue on the 'Tools' page.`,
      `The automatic salary payment feature has been moved to the 'Tools' page.`,
      `Transaction creation page has received several improvements.`,
      `Fixed various bugs on that page causing weird behavior.`,
      `There is now a checkbox to allow putting someone into debt from a transaction.`,
      `When making transactions, the transferred amount can be split equally amongst all members of a social group. `
      + `(The old behavior of each member sending or receiving the full amount can still be used, too.)`,
      `Added this changelog to the front page. The sign out button is now in the top bar, and the salary payment thing `
      + `and the pin changer are on the tools page.`
    ])
  ];

  constructor() { }

  ngOnInit() { }
}
