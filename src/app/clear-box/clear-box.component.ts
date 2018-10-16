import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-clear-box',
  templateUrl: './clear-box.component.html',
  styleUrls: ['./clear-box.component.scss']
})
export class ClearBoxComponent implements OnInit {
  @Input() showButton: boolean = true;
  @Output() buttonClick = new EventEmitter<null>();

  constructor() { }

  ngOnInit() { }
}
