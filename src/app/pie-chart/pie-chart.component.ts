import { Component, OnInit, Input } from '@angular/core';

export class PieSection {
  constructor(public readonly size: number, public readonly cssClass: string) { }
}

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {
  @Input() sections: PieSection[] = [ ];
  @Input() padding = 0.05;

  get paths(): Array<{data: string, color: string}> {
    const tr = [];
    let total = 0;
    for (const section of this.sections) {
      total += section.size;
    }
    let startAngle = 0;
    for (const section of this.sections) {
      const endAngle = startAngle + section.size / total * Math.PI * 2;
      const midAngle = (startAngle + endAngle) / 2;
      const dx = this.padding * Math.cos(midAngle), dy = this.padding * Math.sin(midAngle);
      const tx = x => (x + dx) / (1 + this.padding), ty = y => (y + dy) / (1 + this.padding);
      // Move to start position.
      const svgPath = `M ${tx(Math.cos(startAngle))} ${ty(Math.sin(startAngle))} `
      // X and Y radius is 1, then an always 0 thing, then whether to go the long way or short way around.
        + `A ${1.0 / (1 + this.padding)} ${1.0 / (1 + this.padding)} 0 ${endAngle - startAngle >= Math.PI ? '1' : '0'} `
      // Always 1, x and y of the end of the arc.
        + `1 ${tx(Math.cos(endAngle))} ${ty(Math.sin(endAngle))}`
      // Line from end of arc to center. SVG automatically draws a line back to the start to make a full pie.
        + `L ${tx(0)} ${ty(0)}`;
      tr.push({ data: svgPath, cssClass: section.cssClass });
      startAngle = endAngle;
    }
    return tr;
  }

  constructor() { }

  ngOnInit() { }
}
