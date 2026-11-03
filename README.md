# Qodly Filter Panel

A Qodly custom component that filters and sorts an entity selection datasource, with no code. Drop it on a page, bind it to the datasource to filter, and list the fields users can filter on. The panel builds the ORDA query itself (with placeholders, so values are never pasted into the query string) and runs it on the datasource, so every component bound to that datasource refreshes.

Permissions still apply on the server: `restrict()` events and roles filter what the query returns.

> Status: 0.1, proof of concept. Tested on 4D main (Nov 2026) with the Qodly renderer.

## Setup in Qodly Studio

1. Install the component (see [Build and install](#build-and-install)).
2. Drop **Filter panel** on a page and set **Filtered datasource** to an entity selection datasource (for example `cars`).
3. Add one row per filter in **Fields**, and optionally rows in **Sort options**.

### Fields

| Setting | Meaning |
| --- | --- |
| Label | Text shown above the control. Can be a translation key of the app. |
| Attribute path | Attribute to filter, relations allowed: `registration`, `model.category.ID`, `availableToday` (computed attributes need a `query` function). |
| Widget | `text`, `number`, `range` (min / max), `date`, `daterange`, `select`, `multiselect`, `toggle` (segmented control with an "any" choice), `checkbox`. |
| Operator | `Automatic` is `contains` for text searches on text attributes, `=` otherwise. Can be forced (`starts with`, `≥`, …). Ranges always use `≥` and `≤`, multiple choice uses `in`. |
| Mode | `Visible`, `Locked, read-only` (shown, not editable) or `Locked, hidden`. Locked fields always apply: use them to scope the panel (for example the user's agency). |
| Value | Default value of a visible field (Reset goes back to it), or the value of a locked field. Literal text, or a datasource reference: `{agency.ID}`, `{mySession:user.ID}`. Ranges are written `40~90`, lists `a,b`. |
| Choices from | For choice widgets. `Automatic`: entities of the related dataclass when the path ends on a related primary key (`color.ID`), Yes / No for booleans, distinct values otherwise. Or force `Distinct values`, `Related entities` or `Fixed list`. |
| Choice label attribute | Attribute of the related dataclass shown in the list (`label`, `name`, `brandModelString`…). |
| Fixed choices | `value:Label` pairs separated by commas: `false:Busy, true:Available`. For a checkbox, the value used when checked (default `true`). |
| "Any" label | Text of the empty choice (`Both`, `All agencies`…). |
| URL name | Name of the field in the URL (default: last part of the attribute path). |
| Columns spanned | Width of the field in the grid. |

### Sort options

Each row is a label and an order by expression (`drp desc, registration`). The row marked **Default** applies when the page opens and after Reset.

### Behaviour

- **Apply filters**: `Live` (each change runs the query; typing waits 400 ms) or `With a button`.
- **Reset button**: goes back to default values and default sort.
- **Keep filters in URL**: writes visible filter values to the page URL, so a filtered page can be bookmarked or shared. `replace` keeps one history entry; `push` adds one per change and the browser Back button restores the previous filters. Locked fields never go in the URL.
- **URL prefix**: prefix of the URL parameters, default the datasource name: `?w=main&cars.category=7&cars.drp=40~90`. Each panel on a page needs its own prefix, and only one panel should target a given datasource.

The panel owns the datasource contents: it queries the whole dataclass (plus locked fields). Set the datasource initial value to `all` or `empty`.

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
  --fp-control-height: 36px;
  --fp-radius: 8px;
  --fp-gap: 16px;
}
```

The **Columns** and **Accent color** properties cover the common cases.

## Translations

Field labels, placeholders, choice labels and sort labels are looked up in the app translations (`Shared/i18n.json`) for the user language; text without a translation is shown as is. The Apply, Reset, Sort and Any labels use Qodly's translatable fields when i18n is enabled.

## Build and install

```bash
npm install
npm run build   # creates qodly_<app_id>.zip
```

Upload the zip in Qodly Studio, or unzip it in `Project/Sources/Shared/CustomComponents/qodly_<app_id>/` and add its `dist/manifest.json` entry (with `url`) to `Shared/CustomComponents/manifest.json`.

`@module-federation/vite` is pinned to 1.8.1: later versions bundle the shared `@ws-ui/webform-editor` fallback eagerly, with a bare `import '@ws-ui/code-editor'` the renderer cannot resolve, and the component is reported as "not resolved".

## Development

```bash
npm run dev   # standalone editor on http://localhost:5001, proxied to the 4D server (see .env.example)
```
