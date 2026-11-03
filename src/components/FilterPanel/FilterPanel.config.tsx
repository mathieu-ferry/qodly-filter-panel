import { EComponentKind, T4DComponentConfig, T4DComponentDatasourceDeclaration } from '@ws-ui/webform-editor';
import { Settings } from '@ws-ui/webform-editor';
import { MdFilterList } from 'react-icons/md';

import FilterPanelSettings, { BasicSettings } from './FilterPanel.settings';
import { DS_REF } from './query';
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
      // Qodly only loads the attributes a page declares: declare those read by field values ({name.path})
      // biome-ignore lint/suspicious/noExplicitAny: Qodly passes its generic element props
      declarations: (props: any) => {
        const { datasource = '', fields = [] } = props as { datasource?: string; fields?: IField[] };
        const declarations: T4DComponentDatasourceDeclaration[] = [{ path: datasource, iterable: true }];
        for (const field of fields) {
          const ref = (field.value || '').trim().match(DS_REF);
          if (ref) {
            const [, namespace, name, path] = ref;
            declarations.push({ path: `${namespace ? `${namespace}:` : ''}${name}${path}` });
          }
        }
        return declarations;
      },
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
