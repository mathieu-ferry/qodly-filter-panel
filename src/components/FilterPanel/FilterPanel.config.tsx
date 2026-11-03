import { EComponentKind, T4DComponentConfig } from '@ws-ui/webform-editor';
import { Settings } from '@ws-ui/webform-editor';
import { MdFilterList } from 'react-icons/md';

import FilterPanelSettings, { BasicSettings } from './FilterPanel.settings';
import { IField, ISort } from './types';

export default {
  craft: {
    displayName: 'FilterPanel',
    kind: EComponentKind.BASIC,
    props: {
      name: '',
      classNames: [],
      events: [],
    },
    related: {
      settings: Settings(FilterPanelSettings, BasicSettings),
    },
    sanityCheck: {
      keys: [{ name: 'datasource', require: true, isDatasource: true }],
    },
    requiredFields: {
      keys: ['datasource'],
      all: false,
    },
  },
  info: {
    settings: FilterPanelSettings,
    displayName: 'Filter panel',
    exposed: true,
    icon: MdFilterList,
    events: [
      { label: 'On Apply', value: 'onapply' },
      { label: 'On Reset', value: 'onreset' },
    ],
    datasources: {
      accept: ['entitySel'],
    },
  },
  defaultProps: {
    fields: [],
    sorts: [],
    applyMode: 'live',
    showReset: true,
    urlSync: 'off',
    columns: 4,
    applyLabel: 'Apply',
    resetLabel: 'Reset',
    sortLabel: 'Sort by',
    anyLabel: 'Any',
    style: { width: '100%' },
  },
} as T4DComponentConfig<IFilterPanelProps>;

export type TLabel = string | { key: string; default: string; __t: 'i18n' };

export interface IFilterPanelProps extends webforms.ComponentProps {
  fields?: IField[];
  sorts?: ISort[];
  applyMode?: 'live' | 'button';
  showReset?: boolean;
  urlSync?: 'off' | 'replace' | 'push';
  urlKey?: string;
  columns?: number;
  accentColor?: string;
  applyLabel?: TLabel;
  resetLabel?: TLabel;
  sortLabel?: TLabel;
  anyLabel?: TLabel;
}
