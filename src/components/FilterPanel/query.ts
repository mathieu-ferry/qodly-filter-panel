import { IAttrInfo, IField, IRange, TValue, TValues } from './types';

const NUMERIC = ['long', 'long64', 'word', 'byte', 'number', 'integer', 'float', 'duration'];

export function fieldKey(field: IField, index: number): string {
  return field.key || field.attribute?.split('.').filter((s) => s !== 'ID').pop() || `f${index}`;
}

export function isEmpty(value: TValue): boolean {
  if (value === undefined || value === null || value === '' || value === false) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return !(value as IRange).min && !(value as IRange).max;
  return false;
}

// Converts a text value to what the 4D query expects for the attribute type
function convert(value: string, info: IAttrInfo | null): unknown {
  if (!info) return value;
  if (NUMERIC.includes(info.type)) {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  if (info.type === 'bool') return value === 'true' || value === '1';
  return value;
}

function defaultOperator(field: IField, info: IAttrInfo | null): string {
  if (field.operator && field.operator !== 'auto') return field.operator;
  const isText = !info || info.type === 'string' || info.type === 'text';
  return field.widget === 'text' && isText ? 'contains' : '=';
}

interface ICondition {
  text: string;
  params: unknown[];
}

function condition(field: IField, value: TValue, info: IAttrInfo | null): ICondition[] {
  const attr = field.attribute!;
  const one = (op: string, v: unknown): ICondition[] => (v === undefined ? [] : [{ text: `${attr} ${op} :?`, params: [v] }]);
  switch (field.widget) {
    case 'range':
    case 'daterange': {
      const r = value as IRange;
      return [...(r.min ? one('>=', convert(r.min, info)) : []), ...(r.max ? one('<=', convert(r.max, info)) : [])];
    }
    case 'multiselect':
      return one('in', (value as string[]).map((v) => convert(v, info)));
    case 'checkbox':
      return one('=', field.staticOptions ? convert(field.staticOptions, info) : true);
    default: {
      const op = defaultOperator(field, info);
      const v = String(value);
      switch (op) {
        case 'contains':
          return one('=', `@${v}@`);
        case 'startswith':
          return one('=', `${v}@`);
        case 'endswith':
          return one('=', `@${v}`);
        default:
          return one(op, convert(v, info));
      }
    }
  }
}

export function buildQuery(
  fields: IField[],
  values: TValues,
  infos: (IAttrInfo | null)[],
): { query: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];
  fields.forEach((field, i) => {
    if (!field.attribute || isEmpty(values[i])) return;
    for (const c of condition(field, values[i], infos[i])) {
      params.push(...c.params);
      parts.push(c.text.replace(':?', `:${params.length}`));
    }
  });
  return { query: parts.join(' AND '), params };
}

export function parseSort(expression = ''): { name: string; order: string }[] {
  return expression
    .split(',')
    .map((s) => s.trim().split(/\s+/))
    .filter(([name]) => !!name)
    .map(([name, order]) => ({ name, order: /^desc/i.test(order || '') ? 'desc' : 'asc' }));
}

// URL state: "<panelKey>.<fieldKey>=value", ranges as "min~max", lists comma separated
export function serialize(field: IField, value: TValue): string {
  switch (field.widget) {
    case 'range':
    case 'daterange': {
      const r = value as IRange;
      return `${r.min || ''}~${r.max || ''}`;
    }
    case 'multiselect':
      return (value as string[]).join(',');
    case 'checkbox':
      return '1';
    default:
      return String(value);
  }
}

export function deserialize(field: IField, text: string): TValue {
  switch (field.widget) {
    case 'range':
    case 'daterange': {
      const [min, max] = text.split('~');
      return { min: min || undefined, max: max || undefined };
    }
    case 'multiselect':
      return text.split(',').filter(Boolean);
    case 'checkbox':
      return text === '1' || text === 'true';
    default:
      return text;
  }
}

export function emptyValue(field: IField): TValue {
  switch (field.widget) {
    case 'range':
    case 'daterange':
      return {};
    case 'multiselect':
      return [];
    case 'checkbox':
      return false;
    default:
      return '';
  }
}

// The "value" setting of a field: a literal, or "{name.path}" / "{namespace:name.path}" for a datasource
export const DS_REF = /^\{\s*(?:([\w$]+):)?([\w$]+)((?:\.[\w$]+)*)\s*\}$/;
