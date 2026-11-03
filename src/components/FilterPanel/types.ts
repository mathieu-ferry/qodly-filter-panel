export type TWidget =
  | 'text'
  | 'number'
  | 'range'
  | 'date'
  | 'daterange'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'checkbox';

export type TOperator =
  | 'auto'
  | 'contains'
  | 'startswith'
  | 'endswith'
  | '='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>=';

export type TMode = 'visible' | 'readonly' | 'hidden';

export type TOptionsSource = 'auto' | 'distinct' | 'related' | 'static';

export interface IField {
  label?: string;
  attribute?: string;
  widget?: TWidget;
  operator?: TOperator;
  key?: string;
  mode?: TMode;
  value?: string;
  options?: TOptionsSource;
  optionLabel?: string;
  staticOptions?: string;
  anyLabel?: string;
  placeholder?: string;
  span?: number;
}

export interface ISort {
  label?: string;
  expression?: string;
  isDefault?: boolean;
}

export interface IOption {
  value: string;
  label: string;
}

export interface IRange {
  min?: string;
  max?: string;
}

// One entry per field, same index as the fields setting
export type TValue = string | string[] | boolean | IRange | undefined;
export type TValues = TValue[];

export interface IAttrInfo {
  type: string; // 4D attribute type: string, long, number, bool, date…
  dataClass: string; // dataclass holding the final attribute
  attribute: string; // final attribute name
  isRelatedKey: boolean; // path ends on the primary key of a related dataclass
}
