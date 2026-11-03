# Qodly Filter Panel

A [Qodly](https://developer.4d.com/qodly/) custom component that filters and sorts an entity selection datasource without code.

Drop it on a page, bind it to the datasource to filter, and list the fields users can filter on: text search, dropdown, multiple choice, min / max, dates, segmented choice, checkbox, plus a sort menu. The panel builds the ORDA query itself and runs it on the datasource, so every component bound to that datasource (data table, matrix, counters…) refreshes.

- Values are passed as query placeholders (`:1`, `:2`…), never pasted into the query string.
- Relations and computed attributes work: `category.ID`, `supplier.country`, or a computed attribute that has a `query` function.
- Permissions still apply on the server: `restrict()` events and roles filter what the query returns.

> Status: 0.1. Tested with 4D 21 (Qodly renderer 1.43).

## Install

Download `qodly-filter-panel_v<version>.zip` from the [latest release](https://github.com/mathieu-ferry/qodly-filter-panel/releases/latest), then upload it in Qodly Studio: see [Installing a custom component](https://developer.4d.com/qodly/4DQodlyPro/pageLoaders/components/uploadCustomComponents#installing-custom-component). The **Filter panel** then appears in the Studio component list.

## Example

A page lists products in a data table bound to the `products` datasource (dataclass `Product`). A filter panel bound to the same datasource, with these fields:

| Label | Attribute path | Widget | Notes |
| --- | --- | --- | --- |
| Name | `name` | Text search | Contains, by default |
| Category | `category.ID` | Dropdown | Choices from the related `Category` entities, labelled by `name` |
| Price | `price` | Min / max | |
| Availability | `inStock` | Segmented | Fixed choices `true:In stock, false:Sold out`, "Any" label `All` |

and sort options `Name` (`name`, default) and `Price, high to low` (`price desc`), builds queries like:

```text
name = :1 AND category.ID = :2 AND price >= :3 AND price <= :4 order by price desc
params: ["@lamp@", 4, 20, 80]
```

## Setup in Qodly Studio

1. Install the component (see [Install](#install)).
2. Drop **Filter panel** on a page and set **Filtered datasource** to an entity selection datasource. Set the datasource initial value to `empty`: the panel runs the first query itself.
3. Add one row per filter in **Fields**, and optionally rows in **Sort options**.

### Fields

| Setting | Meaning |
| --- | --- |
| Label | Text shown above the control. Can be a translation key of the app. |
| Attribute path | Attribute to filter, relations allowed: `name`, `category.ID`, `supplier.country`. |
| Widget | `Text search`, `Number`, `Min / max`, `Date`, `Date range`, `Dropdown`, `Multiple choice`, `Segmented (any / a / b)`, `Checkbox`. |
| Operator | `Automatic` is `contains` for text searches on text attributes, `=` otherwise. Can be forced (`starts with`, `≥`, …). Ranges always use `≥` and `≤`, multiple choice uses `in`. |
| Mode | `Visible`, `Locked, read-only` (shown, not editable) or `Locked, hidden`. Locked fields always apply: use them to scope the panel, for example to the current user's store. |
| Value | Default value of a visible field (Reset goes back to it), or the value of a locked field. Literal text, or a datasource reference: `{currentStore.ID}`, `{session:user.ID}` (`namespace:name.path`). Ranges are written `20~80`, lists `a,b`. A locked field bound to a datasource that has no value yet holds the query back until the datasource gets one, and the panel queries again when it changes. |
| Choices from | For choice widgets. `Automatic`: entities of the related dataclass when the path ends on a related primary key (`category.ID`), Yes / No for booleans, distinct values otherwise. Or force `Distinct values`, `Related entities` or `Fixed list`. |
| Choice label attribute | Attribute of the related dataclass shown in the list (`name`, `label`…). |
| Fixed choices | `value:Label` pairs separated by commas: `true:In stock, false:Sold out`. For a checkbox, the value used when checked (default `true`). |
| "Any" label | Text of the empty choice (`All`, `Any category`…). |
| Placeholder | Placeholder of text inputs and dropdowns, or the text next to a checkbox. |
| URL name | Name of the field in the URL (default: last part of the attribute path). |
| Columns spanned | Width of the field in the grid. |

### Sort options

Each row is a label and an order by expression (`price desc, name`). The row marked **Default** applies when the page opens and after Reset.

### Behaviour

- **Apply filters**: `Live` (each change runs the query; typing waits 400 ms) or `With a button`.
- **Reset button**: goes back to default values and default sort.
- **Keep filters in URL**: writes visible filter values to the page URL, so a filtered page can be bookmarked or shared. `replace` keeps one history entry; `push` adds one per change and the browser Back button restores the previous filters. Locked fields never go in the URL.
- **URL prefix**: prefix of the URL parameters, default the datasource name: `?w=catalog&products.category=4&products.price=20~80`. Each panel on a page needs its own prefix, and only one panel should target a given datasource.

The panel owns the datasource contents: each query runs on the whole dataclass, with the locked fields as the base scope.

### Events

- **On Apply**: after each query, with `{ query, params, sort }`.
- **On Reset**: after Reset.

## Styling

Every part has a stable class: `fp-panel`, `fp-fields`, `fp-field`, `fp-field-<widget>`, `fp-label`, `fp-input`, `fp-select`, `fp-range`, `fp-segmented`, `fp-segment`, `fp-chip`, `fp-checkbox`, `fp-actions`, `fp-apply`, `fp-reset`; selected segments and chips get `fp-on`, locked read-only fields `fp-readonly`.

Colours and sizes go through CSS variables you can override in a shared CSS class:

```css
self .fp-panel {
  --fp-accent: #2563eb;
  --fp-border: #d1d5db;
  --fp-control-bg: #ffffff;
  --fp-control-height: 36px;
  --fp-radius: 8px;
  --fp-gap: 16px;
  --fp-font-size: 14px;
}
```

The **Columns** and **Accent color** properties cover the common cases. Under 720 px wide the fields stack in one column.

## Translations

Field labels, placeholders, choice labels and sort labels are looked up in the app translations (`Shared/i18n.json`) for the user language; text without a translation is shown as is. Like any component property, the fields and sort options can also be translated per language in Studio's localization mode. The Apply, Reset, Sort and Any labels use Qodly's translatable fields when i18n is enabled.

## Build from source

```bash
npm install
npm run build   # creates qodly_<app_id>.zip, the same file as a release
```

Upload the zip in Qodly Studio, or unzip it in `Project/Sources/Shared/CustomComponents/qodly_<app_id>/` and add its `dist/manifest.json` entry (with `url`) to `Shared/CustomComponents/manifest.json`.

To publish a release, set `version` in `package.json`, then push a matching tag (`git tag v0.2.0 && git push origin v0.2.0`): the `release` workflow builds the zip and attaches it to a new GitHub release.

`@module-federation/vite` is pinned to 1.8.1: later versions bundle the shared `@ws-ui/webform-editor` fallback eagerly, with a bare `import '@ws-ui/code-editor'` the renderer cannot resolve, and the component is reported as "not resolved".

## How it works

The panel calls the bound datasource's `callAction("query", { query, params })` (and `callAction("orderBy", …)` when only sorting), the same entry point as Qodly's built-in "query" standard action. Choice lists come from the REST API (`/rest/<Dataclass>/<attribute>?$distinct=true`, or the related dataclass entities), and attribute types from `/rest/$catalog/<Dataclass>`.

## Development

```bash
npm run dev   # standalone editor on http://localhost:5001, proxied to the 4D server (see .env.example)
```
