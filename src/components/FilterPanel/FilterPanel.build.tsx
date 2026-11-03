import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useMemo } from 'react';

import { parseStaticOptions } from './catalog';
import { IFilterPanelProps } from './FilterPanel.config';
import Panel from './Panel';
import { deserialize, emptyValue } from './query';
import { useTranslate } from './translate';

// Canvas preview: real layout with sample choices, no data access
const FilterPanel: FC<IFilterPanelProps> = ({
  fields = [],
  sorts = [],
  applyMode = 'live',
  showReset = true,
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
  const {
    connectors: { connect },
  } = useEnhancedNode();
  const t = useTranslate();

  const values = useMemo(
    () => fields.map((f) => (f.value && !f.value.trim().startsWith('{') ? deserialize(f, f.value) : emptyValue(f))),
    [fields],
  );
  const options = useMemo(
    () =>
      fields.map((f) =>
        f.staticOptions
          ? parseStaticOptions(f.staticOptions)
          : [
              { value: 'a', label: 'Choice A' },
              { value: 'b', label: 'Choice B' },
            ],
      ),
    [fields],
  );

  return (
    <div ref={connect} style={style} className={cn(className, classNames)}>
      {fields.length === 0 ? (
        <div className="fp-empty">Filter panel: add fields in the Filters properties.</div>
      ) : (
        <Panel
          fields={fields}
          values={values}
          options={options}
          sorts={sorts}
          sortIndex={sorts.findIndex((s) => s.isDefault)}
          liveApply={applyMode === 'live'}
          showReset={showReset}
          columns={columns}
          accentColor={accentColor}
          labels={{
            apply: t(applyLabel) || 'Apply',
            reset: t(resetLabel) || 'Reset',
            sort: t(sortLabel) || 'Sort by',
            any: t(anyLabel) || 'Any',
          }}
          t={t}
          disabled
        />
      )}
    </div>
  );
};

export default FilterPanel;
