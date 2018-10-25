import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PieSection } from '../pie-chart/pie-chart.component';
import { WebappBackendService, Class } from '../webapp-backend.service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MetricsComponent implements OnInit {
  public wealthPie: PieSection[] = [];
  public salaryPie: PieSection[] = [];
  public populationPie: PieSection[] = [];

  constructor(private backend: WebappBackendService) { }

  private async updateData() {
    let orangeWealth = 0, blueWealth = 0, orangeSalary = 0, blueSalary = 0, numOranges = 0, numBlues = 0;
    const jobs = this.backend.getCachedJobList();
    const members = this.backend.getCachedMemberList();
    const ledger = this.backend.getCachedLedger();

    for (const member of await members) {
      if (member.class === Class.ORANGE) {
        orangeWealth += member.currentWealth;
        for (const job of await jobs) {
          if (member.jobs.findIndex(v => v === job.id) !== -1) {
            orangeSalary += job.orangeSalary;
          }
        }
        numOranges += 1;
      } else if (member.class === Class.BLUE) {
        blueWealth += member.currentWealth;
        for (const job of await jobs) {
          if (member.jobs.findIndex(v => v === job.id) !== -1) {
            blueSalary += job.blueSalary;
          }
        }
        numBlues += 1;
      }
    }

    this.wealthPie = [new PieSection(blueWealth, 'blue', 'Blue'), new PieSection(orangeWealth, 'orange', 'Orange')];
    this.salaryPie = [new PieSection(blueSalary, 'blue', 'Blue'), new PieSection(orangeSalary, 'orange', 'Orange')];
    this.populationPie = [new PieSection(numBlues, 'blue', 'Blue'), new PieSection(numOranges, 'orange', 'Orange')];
  }

  ngOnInit() {
    this.updateData();
  }
}
