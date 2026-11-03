import { useRenderer, useSources, useWebformPath } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadOptions, resolveAttribute } from './catalog';
import { IFilterPanelProps } from './FilterPanel.config';
import Panel from './Panel';
import {
  DS_REF,
  buildQuery,
  deserialize,
  emptyValue,
  fieldKey,
  isEmpty,
  parseSort,
  serialize,
} from './query';
import { useTranslate } from './translate';
import { IAttrInfo, IField, IOption, TValue, TValues } from './types';

const CHOICES = ['select', 'multiselect', 'toggle'];
const TYPED = ['text', 'number', 'range', 'date', 'daterange'];

interface IEntitySelSource {
  id: string;
  getDataClass(): { getName(): string } | null;
  callAction(action: string, options?: object): Promise<void>;
}

interface ISource {
  getValue(path?: string): Promise<unknown>;
  addListener(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
}

const FilterPanel: FC<IFilterPanelProps> = ({
  fields = [],
  sorts = [],
  applyMode = 'live',
  showReset = true,
  urlSync = 'off',
  urlKey,
  columns = 4,
  accentColor,
  applyLabel,
  resetLabel,
  sortLabel,
  anyLabel,
  style,
  className,
  classNames = [],
}) => {
  const { connect, emit } = useRenderer();
  const {
    sources: { datasource },
  } = useSources();
  const ds = datasource as unknown as IEntitySelSource | undefined;
  const webformPath = useWebformPath();
  const t = useTranslate();

  const defaultSort = sorts.findIndex((s) => s.isDefault);
  const infos = useRef<(IAttrInfo | null)[]>([]);
  const [options, setOptions] = useState<IOption[][]>([]);
  const [values, setValues] = useState<TValues>(() => fields.map(emptyValue));
  const [sortIndex, setSortIndex] = useState(defaultSort);
  const defaults = useRef<TValues>([]);
  const queue = useRef(Promise.resolve());
  const latest = useRef(0);
  const typingTimer = useRef<number>();
  const prefix = urlKey || ds?.id || 'filter';
  const fieldsSignature = JSON.stringify(fields);
  // Bumped when a datasource used in a field value changes: values are resolved again
  const [refStamp, setRefStamp] = useState(0);

  const getRefSource = useCallback(
    (text: string): { source?: ISource; path?: string } => {
      const ref = text.trim().match(DS_REF);
      if (!ref) return {};
      const [, namespace, name, path] = ref;
      const source = window.DataSource.getSource(name, namespace || webformPath) as unknown as
        | ISource
        | undefined;
      return { source, path: path ? path.slice(1) : undefined };
    },
    [webformPath],
  );

  // A field value from its "value" setting: literal text, or {name.path} / {namespace:name.path}
  const resolveValue = useCallback(
    async (field: IField): Promise<TValue> => {
      const text = (field.value || '').trim();
      if (!text) return emptyValue(field);
      if (!DS_REF.test(text)) return deserialize(field, text);
      const { source, path } = getRefSource(text);
      if (!source) {
        console.warn(`FilterPanel: datasource ${text} not found for field ${field.attribute}`);
        return emptyValue(field);
      }
      const v = await source.getValue(path);
      if (v === null || v === undefined) return emptyValue(field);
      return Array.isArray(v) ? v.map(String) : typeof v === 'boolean' ? v : String(v);
    },
    [getRefSource],
  );

  const writeUrl = useCallback(
    (vals: TValues, si: number) => {
      if (urlSync === 'off') return;
      const params = new URLSearchParams(window.location.search);
      for (const k of [...params.keys()]) if (k.startsWith(`${prefix}.`)) params.delete(k);
      fields.forEach((f, i) => {
        if ((f.mode || 'visible') === 'visible' && !isEmpty(vals[i])) {
          params.set(`${prefix}.${fieldKey(f, i)}`, serialize(f, vals[i]));
        }
      });
      if (si >= 0 && si !== defaultSort) params.set(`${prefix}.sort`, String(si));
      const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`)
        return;
      if (urlSync === 'push') window.history.pushState(window.history.state, '', url);
      else window.history.replaceState(window.history.state, '', url);
    },
    [urlSync, prefix, fields, defaultSort],
  );

  const readUrl = useCallback(
    (base: TValues): { vals: TValues; si: number } => {
      const params = new URLSearchParams(window.location.search);
      const vals = fields.map((f, i) => {
        const text = params.get(`${prefix}.${fieldKey(f, i)}`);
        return (f.mode || 'visible') === 'visible' && text !== null
          ? deserialize(f, text)
          : base[i];
      });
      const si = params.has(`${prefix}.sort`) ? Number(params.get(`${prefix}.sort`)) : defaultSort;
      return { vals, si: sorts[si] ? si : defaultSort };
    },
    [fields, sorts, prefix, defaultSort],
  );

  // Queries run one after the other; a query superseded while waiting is skipped
  const apply = useCallback(
    (vals: TValues, si: number, updateUrl = true) => {
      if (!ds) return;
      const run = ++latest.current;
      if (updateUrl) writeUrl(vals, si);
      queue.current = queue.current.then(async () => {
        if (run !== latest.current) return;
        const { query, params } = buildQuery(fields, vals, infos.current);
        const sort = sorts[si]?.expression?.trim();
        try {
          if (query) {
            await ds.callAction('query', {
              query: sort ? `${query} order by ${sort}` : query,
              params,
            });
          } else {
            await ds.callAction('all');
            if (sort) await ds.callAction('orderBy', { orderBy: parseSort(sort) });
          }
          emit('onapply', { query, params, sort });
        } catch (e) {
          console.error('FilterPanel: query failed', query, params, e);
        }
      });
    },
    [ds, fields, sorts, writeUrl, emit],
  );

  // Re-resolve values when a datasource referenced by a field value changes (e.g. the session user loads)
  useEffect(() => {
    const sources = [
      ...new Set(fields.map((f) => getRefSource(f.value || '').source).filter(Boolean)),
    ] as ISource[];
    const onRefChange = () => setRefStamp((n) => n + 1);
    for (const s of sources) s.addListener('changed', onRefChange);
    return () => {
      for (const s of sources) s.removeListener('changed', onRefChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldsSignature, getRefSource]);

  // Attribute types and choice lists, then initial values (locked, URL, defaults) and first query
  useEffect(() => {
    if (!ds) return;
    let cancelled = false;
    (async () => {
      const root = ds.getDataClass()?.getName() || '';
      const resolved = await Promise.all(
        fields.map((f) => (f.attribute ? resolveAttribute(root, f.attribute) : null)),
      );
      resolved.forEach((info, i) => {
        if (fields[i].attribute && !info) {
          console.warn(`FilterPanel: attribute "${fields[i].attribute}" not found in ${root}`);
        }
      });
      const base = await Promise.all(fields.map(resolveValue));
      if (cancelled) return;
      defaults.current = base;
      infos.current = resolved;
      const lists = await Promise.all(
        fields.map((f, i) =>
          CHOICES.includes(f.widget || '') ? loadOptions(f, resolved[i]).catch(() => []) : [],
        ),
      );
      if (cancelled) return;
      setOptions(lists);
      const { vals, si } = readUrl(base);
      setValues(vals);
      setSortIndex(si);
      // A locked field bound to a datasource that has no value yet: wait for it rather than widen the scope
      const waiting = fields.some(
        (f, i) =>
          (f.mode || 'visible') !== 'visible' &&
          DS_REF.test((f.value || '').trim()) &&
          isEmpty(base[i]),
      );
      if (!waiting && (vals.some((v) => !isEmpty(v)) || si >= 0)) apply(vals, si, false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds, fieldsSignature, refStamp]);

  // "One history step per change": going back re-applies the filters found in the URL
  useEffect(() => {
    if (urlSync !== 'push') return;
    const onPop = () => {
      const { vals, si } = readUrl(defaults.current);
      setValues(vals);
      setSortIndex(si);
      apply(vals, si, false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [urlSync, readUrl, apply]);

  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  const onChange = (index: number, value: TValue) => {
    const vals = values.map((v, i) => (i === index ? value : v));
    setValues(vals);
    if (applyMode !== 'live') return;
    window.clearTimeout(typingTimer.current);
    if (TYPED.includes(fields[index].widget || 'text')) {
      typingTimer.current = window.setTimeout(() => apply(vals, sortIndex), 400);
    } else {
      apply(vals, sortIndex);
    }
  };

  const onSort = (index: number) => {
    setSortIndex(index);
    if (applyMode === 'live') apply(values, index);
  };

  const onReset = () => {
    window.clearTimeout(typingTimer.current);
    setValues(defaults.current);
    setSortIndex(defaultSort);
    apply(defaults.current, defaultSort);
    emit('onreset');
  };

  const labels = useMemo(
    () => ({
      apply: t(applyLabel) || 'Apply',
      reset: t(resetLabel) || 'Reset',
      sort: t(sortLabel) || 'Sort by',
      any: t(anyLabel) || 'Any',
    }),
    [t, applyLabel, resetLabel, sortLabel, anyLabel],
  );

  return (
    <div ref={connect} style={style} className={cn(className, classNames)}>
      <Panel
        fields={fields}
        values={values}
        options={options}
        sorts={sorts}
        sortIndex={sortIndex}
        liveApply={applyMode === 'live'}
        showReset={showReset}
        columns={columns}
        accentColor={accentColor}
        labels={labels}
        t={t}
        onChange={onChange}
        onSort={onSort}
        onApply={() => {
          window.clearTimeout(typingTimer.current);
          apply(values, sortIndex);
        }}
        onReset={onReset}
      />
    </div>
  );
};

export default FilterPanel;
