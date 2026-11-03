import { IAttrInfo, IField, IOption } from './types';

interface ICatalogAttribute {
  name: string;
  kind: string;
  type: string;
  identifying?: boolean;
}

interface ICatalogDataClass {
  name: string;
  attributes: ICatalogAttribute[];
  key?: { name: string }[];
}

const catalogCache = new Map<string, Promise<ICatalogDataClass | null>>();

export function getDataClass(name: string): Promise<ICatalogDataClass | null> {
  if (!catalogCache.has(name)) {
    catalogCache.set(
      name,
      fetch(`/rest/$catalog/${encodeURIComponent(name)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.dataClasses?.[0] ?? null)
        .catch(() => null),
    );
  }
  return catalogCache.get(name)!;
}

// Walks "category.parent.ID" from the root dataclass. Returns null when a step does not exist.
export async function resolveAttribute(root: string, path: string): Promise<IAttrInfo | null> {
  const steps = path.split('.').filter(Boolean);
  let dataClass = root;
  for (let i = 0; i < steps.length; i++) {
    const dc = await getDataClass(dataClass);
    const attr = dc?.attributes.find((a) => a.name === steps[i]);
    if (!dc || !attr) return null;
    const last = i === steps.length - 1;
    if (attr.kind === 'relatedEntity' || attr.kind === 'relatedEntities') {
      if (last) return null; // a relation must end on one of its attributes
      dataClass = attr.kind === 'relatedEntity' ? attr.type : attr.type.replace(/Selection$/, '');
      continue;
    }
    if (!last) return null;
    const keyName = dc.key?.[0]?.name ?? 'ID';
    return {
      type: attr.type,
      dataClass,
      attribute: attr.name,
      isRelatedKey: dataClass !== root && attr.name === keyName,
    };
  }
  return null;
}

export function parseStaticOptions(text = ''): IOption[] {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf(':');
      return i < 0 ? { value: s, label: s } : { value: s.slice(0, i).trim(), label: s.slice(i + 1).trim() };
    });
}

export async function loadOptions(field: IField, info: IAttrInfo | null): Promise<IOption[]> {
  const source = field.options || 'auto';
  if (source === 'static' || (source === 'auto' && field.staticOptions)) {
    return parseStaticOptions(field.staticOptions);
  }
  if (!info) return [];
  if (info.type === 'bool' && source === 'auto') {
    return [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ];
  }
  const dc = encodeURIComponent(info.dataClass);
  if (source === 'related' || (source === 'auto' && info.isRelatedKey)) {
    const label = field.optionLabel || info.attribute;
    const url = `/rest/${dc}?$attributes=${info.attribute},${label}&$orderby=${label}&$top=1000`;
    const res = await fetch(url).then((r) => (r.ok ? r.json() : null));
    return (res?.__ENTITIES ?? []).map((e: Record<string, unknown>) => ({
      value: String(e[info.attribute]),
      label: String(e[label] ?? e[info.attribute]),
    }));
  }
  const res = await fetch(`/rest/${dc}/${info.attribute}?$distinct=true`).then((r) => (r.ok ? r.json() : null));
  return (Array.isArray(res) ? res : [])
    .filter((v) => v !== null && v !== '')
    .map((v) => ({ value: String(v), label: String(v) }));
}
