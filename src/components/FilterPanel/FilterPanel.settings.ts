import { ESetting, TSetting, getStaticFeaturesExperimentalFlag } from '@ws-ui/webform-editor';
import { BASIC_SETTINGS, DEFAULT_SETTINGS, load } from '@ws-ui/webform-editor';

const isI18nEnabled = getStaticFeaturesExperimentalFlag('i18n');
const labelType = isI18nEnabled ? ESetting.I18NFIELD : ESetting.TEXT_FIELD;

const fieldColumns: TSetting[] = [
  { key: 'label', label: 'Label', type: ESetting.TEXT_FIELD },
  { key: 'attribute', label: 'Attribute path', type: ESetting.TEXT_FIELD, placeholder: 'model.category.ID' },
  {
    key: 'widget',
    label: 'Widget',
    type: ESetting.SELECT,
    defaultValue: 'text',
    options: [
      { value: 'text', label: 'Text search' },
      { value: 'number', label: 'Number' },
      { value: 'range', label: 'Min / max' },
      { value: 'date', label: 'Date' },
      { value: 'daterange', label: 'Date range' },
      { value: 'select', label: 'Dropdown' },
      { value: 'multiselect', label: 'Multiple choice' },
      { value: 'toggle', label: 'Segmented (any / a / b)' },
      { value: 'checkbox', label: 'Checkbox' },
    ],
  },
  {
    key: 'operator',
    label: 'Operator',
    type: ESetting.SELECT,
    defaultValue: 'auto',
    options: [
      { value: 'auto', label: 'Automatic' },
      { value: 'contains', label: 'Contains' },
      { value: 'startswith', label: 'Starts with' },
      { value: 'endswith', label: 'Ends with' },
      { value: '=', label: '=' },
      { value: '!=', label: '≠' },
      { value: '<', label: '<' },
      { value: '<=', label: '≤' },
      { value: '>', label: '>' },
      { value: '>=', label: '≥' },
    ],
  },
  {
    key: 'mode',
    label: 'Mode',
    type: ESetting.SELECT,
    defaultValue: 'visible',
    options: [
      { value: 'visible', label: 'Visible' },
      { value: 'readonly', label: 'Locked, read-only' },
      { value: 'hidden', label: 'Locked, hidden' },
    ],
  },
  {
    key: 'value',
    label: 'Value (default or locked)',
    type: ESetting.TEXT_FIELD,
    placeholder: 'literal or {datasource.path}',
  },
  {
    key: 'options',
    label: 'Choices from',
    type: ESetting.SELECT,
    defaultValue: 'auto',
    options: [
      { value: 'auto', label: 'Automatic' },
      { value: 'distinct', label: 'Distinct values' },
      { value: 'related', label: 'Related entities' },
      { value: 'static', label: 'Fixed list' },
    ],
  },
  { key: 'optionLabel', label: 'Choice label attribute', type: ESetting.TEXT_FIELD, placeholder: 'label' },
  {
    key: 'staticOptions',
    label: 'Fixed choices',
    type: ESetting.TEXT_FIELD,
    placeholder: 'true:Busy, false:Available',
  },
  { key: 'anyLabel', label: '"Any" label', type: ESetting.TEXT_FIELD },
  { key: 'placeholder', label: 'Placeholder', type: ESetting.TEXT_FIELD },
  { key: 'key', label: 'URL name', type: ESetting.TEXT_FIELD },
  { key: 'span', label: 'Columns spanned', type: ESetting.NUMBER_FIELD, defaultValue: 1 },
];

const sortColumns: TSetting[] = [
  { key: 'label', label: 'Label', type: ESetting.TEXT_FIELD },
  { key: 'expression', label: 'Order by', type: ESetting.TEXT_FIELD, placeholder: 'drp desc, registration' },
  { key: 'isDefault', label: 'Default', type: ESetting.CHECKBOX },
];

const dataSettings: TSetting[] = [
  { key: 'datasource', label: 'Filtered datasource', type: ESetting.DS_AUTO_SUGGEST },
  {
    key: 'fields',
    name: 'fields',
    label: 'Fields',
    type: ESetting.DATAGRID,
    titleProperty: 'label',
    data: fieldColumns,
  },
  {
    key: 'sorts',
    name: 'sorts',
    label: 'Sort options',
    type: ESetting.DATAGRID,
    titleProperty: 'label',
    data: sortColumns,
  },
];

const behaviourSettings: TSetting[] = [
  {
    key: 'applyMode',
    label: 'Apply filters',
    type: ESetting.SELECT,
    defaultValue: 'live',
    options: [
      { value: 'live', label: 'Live' },
      { value: 'button', label: 'With a button' },
    ],
  },
  { key: 'showReset', label: 'Reset button', type: ESetting.CHECKBOX, defaultValue: true },
  {
    key: 'urlSync',
    label: 'Keep filters in URL',
    type: ESetting.SELECT,
    defaultValue: 'off',
    options: [
      { value: 'off', label: 'No' },
      { value: 'replace', label: 'Yes, replace history' },
      { value: 'push', label: 'Yes, one history step per change' },
    ],
  },
  { key: 'urlKey', label: 'URL prefix', type: ESetting.TEXT_FIELD, placeholder: 'datasource name' },
];

const lookSettings: TSetting[] = [
  { key: 'columns', label: 'Columns', type: ESetting.NUMBER_FIELD, defaultValue: 4 },
  { key: 'accentColor', label: 'Accent color', type: ESetting.COLOR_PICKER },
  { key: 'applyLabel', label: 'Apply label', type: labelType, defaultValue: 'Apply' },
  { key: 'resetLabel', label: 'Reset label', type: labelType, defaultValue: 'Reset' },
  { key: 'sortLabel', label: 'Sort label', type: labelType, defaultValue: 'Sort by' },
  { key: 'anyLabel', label: '"Any" label', type: labelType, defaultValue: 'Any' },
];

const Settings: TSetting[] = [
  { key: 'data', label: 'Filters', type: ESetting.GROUP, components: dataSettings },
  { key: 'behaviour', label: 'Behaviour', type: ESetting.GROUP, components: behaviourSettings },
  { key: 'look', label: 'Appearance', type: ESetting.GROUP, components: lookSettings },
  ...DEFAULT_SETTINGS,
];

export const BasicSettings: TSetting[] = [
  ...dataSettings,
  ...behaviourSettings,
  ...lookSettings,
  ...load(BASIC_SETTINGS).filter('style.overflow'),
];

export default Settings;
