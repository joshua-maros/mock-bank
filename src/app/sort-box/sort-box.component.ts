import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgForm, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { sortObjects, FilterRule, FilterMode, filterObjects } from '../util';

export type ItemKeyType = 'string' | 'number' | [string, any][];

export class ItemKey {
  constructor(public readonly name: string, public readonly hrName: string, public readonly type: ItemKeyType) { }
};

export class SortKey {
  constructor(public readonly name: string, public readonly reverse: boolean) { }
}

export class SortMode {
  constructor(public readonly name: string, public readonly normalKeys: SortKey[],
    public readonly reverseKeys: SortKey[]) { }
}

@Component({
  selector: 'app-sort-box',
  templateUrl: './sort-box.component.html',
  styleUrls: ['./sort-box.component.scss']
})
export class SortBoxComponent implements OnInit {
  @Input() values: any[] = [];
  @Output() sorted = new EventEmitter<any[]>();
  @Input() filterKeys: ItemKey[] = [];
  @Input() sortModes: SortMode[] = [];
  
  @ViewChild('form') form: NgForm;
  public fg = this.fb.group({
    sortBy: [null],
    reverse: [false],
    filterRules: this.fb.array([])
  });
  public filters: FilterRule[];

  get FilterMode() {
    return FilterMode;
  }

  constructor(private fb: FormBuilder) {
    this.fg.valueChanges.subscribe(() => this.sort());
  }

  createFilterRule(): FormGroup {
    const fk = this.filterKeys[0];
    return this.fb.group({
      key: fk,
      value: fk.type === 'string' ? '' : (fk.type === 'number' ? 0 : fk.type[0][1]),
      mode: fk.type === 'string' ? FilterMode.CONTAINS
            : (fk.type === 'number' ? FilterMode.GREATER_THAN : FilterMode.EQUAL)
    });
  }

  addFilterRule() {
    (this.fg.get('filterRules') as FormArray).push(this.createFilterRule());
  }
  
  removeFilterRule(index: number) {
    (this.fg.get('filterRules') as FormArray).removeAt(index);
  }

  filter() {
    let primRules: Array<{key: ItemKey, value: any, mode: FilterMode}> = this.fg.value.filterRules;
    for (let i = 0; i < primRules.length; i++) {
      const t = primRules[i].key.type;
      const m = primRules[i].mode;
      if (t === 'string' && (m === FilterMode.GREATER_THAN || m === FilterMode.LESS_THAN)
          || t === 'number' && m === FilterMode.CONTAINS
          || typeof(t) === typeof([]) && m !== FilterMode.EQUAL && m !== FilterMode.NOT_EQUAL) {
        this.fg.get(['filterRules', i]).patchValue({
          value: t === 'string' ? '' : (t === 'number' ? 0 : t[0]),
          mode: t === 'string' ? FilterMode.CONTAINS : (t === 'number' ? FilterMode.GREATER_THAN : FilterMode.EQUAL)
        }, {
          emitEvent: false
        });
      }
    }
    primRules = this.fg.value.filterRules;
    return filterObjects(this.values, primRules.map<FilterRule>(k => {
      return new FilterRule(k.key.name, k.value, k.mode);
    }));
  }

  sort() {
    let mode: SortMode = null;
    if (this.fg.value.sortBy) {
      mode = this.fg.value.sortBy;
    } else if (this.sortModes.length > 0) {
      mode = this.sortModes[0];
    }
    if (mode) {
      const keys = this.fg.value.reverse ? mode.reverseKeys : mode.normalKeys;
      const processed = sortObjects(this.filter(), keys.map<{key: string, reverse: boolean}>(
        k => { return { key: k.name, reverse: k.reverse }; }
      ));
      this.sorted.emit(processed);
    } else {
      this.sorted.emit(this.filter());
    }
  }

  ngOnInit() {
    this.sort();
  }
}
