import cn from 'classnames';
import { CSSProperties, FC, KeyboardEvent } from 'react';

import { IField, IOption, IRange, ISort, TValue, TValues } from './types';
import './FilterPanel.css';

export interface IPanelProps {
  fields: IField[];
  values: TValues;
  options: IOption[][];
  sorts: ISort[];
  sortIndex: number;
  liveApply: boolean;
  showReset: boolean;
  columns: number;
  accentColor?: string;
  labels: { apply: string; reset: string; sort: string; any: string };
  t: (text?: string) => string;
  disabled?: boolean;
  onChange?: (index: number, value: TValue) => void;
  onSort?: (index: number) => void;
  onApply?: () => void;
  onReset?: () => void;
}

const Panel: FC<IPanelProps> = ({
  fields,
  values,
  options,
  sorts,
  sortIndex,
  liveApply,
  showReset,
  columns,
  accentColor,
  labels,
  t,
  disabled,
  onChange = () => {},
  onSort = () => {},
  onApply = () => {},
  onReset = () => {},
}) => {
  const style = {
    '--fp-columns': Math.max(1, columns || 4),
    ...(accentColor ? { '--fp-accent': accentColor } : {}),
  } as CSSProperties;
  const onEnter = (e: KeyboardEvent) => e.key === 'Enter' && onApply();

  const control = (field: IField, i: number) => {
    const value = values[i];
    const readOnly = disabled || field.mode === 'readonly';
    const opts = options[i] || [];
    const any = t(field.anyLabel) || labels.any;
    const set = (v: TValue) => onChange(i, v);
    switch (field.widget) {
      case 'number':
      case 'date':
        return (
          <input
            className="fp-input"
            type={field.widget}
            value={(value as string) ?? ''}
            placeholder={t(field.placeholder)}
            disabled={readOnly}
            onChange={(e) => set(e.target.value)}
            onKeyDown={onEnter}
          />
        );
      case 'range':
      case 'daterange': {
        const r = (value as IRange) || {};
        const type = field.widget === 'range' ? 'number' : 'date';
        return (
          <div className="fp-range">
            <input
              className="fp-input fp-range-min"
              type={type}
              value={r.min ?? ''}
              placeholder="min"
              disabled={readOnly}
              onChange={(e) => set({ ...r, min: e.target.value })}
              onKeyDown={onEnter}
            />
            <span className="fp-range-sep">–</span>
            <input
              className="fp-input fp-range-max"
              type={type}
              value={r.max ?? ''}
              placeholder="max"
              disabled={readOnly}
              onChange={(e) => set({ ...r, max: e.target.value })}
              onKeyDown={onEnter}
            />
          </div>
        );
      }
      case 'select':
        return (
          <select
            className="fp-input fp-select"
            value={(value as string) ?? ''}
            disabled={readOnly}
            onChange={(e) => set(e.target.value)}
          >
            <option value="">{t(field.placeholder) || any}</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label)}
              </option>
            ))}
          </select>
        );
      case 'multiselect': {
        const list = (value as string[]) || [];
        return (
          <div className="fp-chips">
            {opts.map((o) => {
              const on = list.includes(o.value);
              return (
                <button
                  type="button"
                  key={o.value}
                  className={cn('fp-chip', { 'fp-on': on })}
                  disabled={readOnly}
                  onClick={() => set(on ? list.filter((v) => v !== o.value) : [...list, o.value])}
                >
                  {t(o.label)}
                </button>
              );
            })}
          </div>
        );
      }
      case 'toggle':
        return (
          <div className="fp-segmented">
            {[{ value: '', label: any }, ...opts].map((o) => (
              <button
                type="button"
                key={o.value}
                className={cn('fp-segment', { 'fp-on': (value ?? '') === o.value })}
                disabled={readOnly}
                onClick={() => set(o.value)}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="fp-checkbox">
            <input type="checkbox" checked={!!value} disabled={readOnly} onChange={(e) => set(e.target.checked)} />
            <span>{t(field.placeholder)}</span>
          </label>
        );
      default:
        return (
          <input
            className="fp-input"
            type="search"
            value={(value as string) ?? ''}
            placeholder={t(field.placeholder)}
            disabled={readOnly}
            onChange={(e) => set(e.target.value)}
            onKeyDown={onEnter}
          />
        );
    }
  };

  return (
    <div className="fp-panel" style={style}>
      <div className="fp-fields">
        {fields.map((field, i) =>
          field.mode === 'hidden' ? null : (
            <div
              key={i}
              className={cn('fp-field', `fp-${field.widget || 'text'}`, { 'fp-readonly': field.mode === 'readonly' })}
              style={{ gridColumn: `span ${Math.max(1, field.span || 1)}` }}
            >
              <span className="fp-label">{t(field.label) || field.attribute}</span>
              {control(field, i)}
            </div>
          ),
        )}
        {sorts.length > 0 && (
          <div className="fp-field fp-sort">
            <span className="fp-label">{labels.sort}</span>
            <select
              className="fp-input fp-select"
              value={sortIndex}
              disabled={disabled}
              onChange={(e) => onSort(Number(e.target.value))}
            >
              {sortIndex < 0 && <option value={-1}>–</option>}
              {sorts.map((s, i) => (
                <option key={i} value={i}>
                  {t(s.label) || s.expression}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {(!liveApply || showReset) && (
        <div className="fp-actions">
          {showReset && (
            <button type="button" className="fp-button fp-reset" disabled={disabled} onClick={onReset}>
              {labels.reset}
            </button>
          )}
          {!liveApply && (
            <button type="button" className="fp-button fp-apply" disabled={disabled} onClick={onApply}>
              {labels.apply}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Panel;
