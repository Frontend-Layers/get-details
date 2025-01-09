# Get Details

Fetch package information directly on your web page by austetic manner

---
## Features

- Runs instantly via CDN `<script>` tag
- Config through a single `data-get-details` attribute
- Supports multiple elements
- Available as ES6 module

---

## Usage

```html
<script src="https://cdn.jsdelivr.net/npm/get-details" data-get-details="package_name"></script>
```

## Extended Configuration

```html
<div data-get-details="package_name, html element, package source"></div>
```

**Parameters:**

`data-get-details="[package-name][,][target-element][,][source]"`

- First parameter (required): Package name to fetch
- Second parameter (optional): Target element selector (default: if `<script>` `#package-version` or element with `data-get-details` attribute )
- Third parameter (optional): Data source (default: `npm`)

### ES6 Module Usage

Import and initialize in your JavaScript:

```javascript
  import getDetails from 'get-details/es.js';
  getDetails({ packageName: 'package-name', target: 'target-element' });
```

---

## Supported Sources

Currently supports fetching data from **NPM**.
Additional sources planned for future releases.

---

## License

MIT License

---

## Contributing

Contributions welcome! Feel free to:

- Fork the repository
- Submit pull requests
- File issues
- Suggest improvements

---

## Roadmap

- Add support for additional package details
- Implement GitHub and PyPI sources
- Add data formatting options
- Support for custom data sources
