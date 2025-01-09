# Get Details

Get package information directly on your web page without import and install.

---

## Features

- Fetches the latest package version dynamically from NPM.
- Easily configurable using `data-*` attributes.
- Supports multiple `<script>` tags for fetching data for different packages.
- Clean and minimal implementation for embedding real-time package data into web pages.

---

## Usage

Simply add a `<script>` tag with the required `data-*` attributes:


<script src="https://cdn.jsdelivr.net/npm/get-details" data-pack="scss-reset"></script>

or longer

```html
<script src="https://your-cdn-link/index.js"
        data-pack="scss-reset"
        data-target="#version"
        data-source="npm"></script>
```


default values for `data-target` is `#version` and `data-source` -- `npm`
```

**Attributes:**
- `data-pack`: (Required) The name of the package to fetch (e.g., `scss-reset`).
- `data-target`: (Optional) The selector for the HTML element where the fetched data will be inserted (e.g., `#version`).
- `data-source`: (Optional) The source of the data (currently supports `npm`).

The script will automatically fetch the package information and insert it into the target element.

### Example HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Get Details</title>
</head>
<body>
  <div>
    <h2>Package Version</h2>
    <p id="version">Loading...</p>
  </div>

  <script src="https://your-cdn-link/index.js" data-pack="scss-reset"></script>
</body>
</html>
```

### Using the NPM Package

Import and initialize in your JavaScript:

```javascript
import initFetcher from 'package-info-fetcher';

initFetcher();
```

Add HTML elements and configure your script:

```html
<div id="version">Loading...</div>
<script src="index.js" defer
        data-pack="scss-reset"
        data-target="#version"
        data-source="npm"></script>
```

---

## How It Works

1. The library scans for `<script>` tags with the `data-pack` attribute.
2. Extracts parameters like `data-pack` (package name), `data-target` (target element), and `data-source` (data source).
3. Fetches the data from the specified source (e.g., NPM Registry).
4. Injects the fetched data (e.g., package version) into the target HTML element.

---

## Supported Sources

Currently, the library only supports fetching data from **NPM**.
Additional sources (e.g., GitHub) are planned for future releases.

---

## License

This project is licensed under the **MIT License**.

---

## Contributing

Contributions are welcome! Feel free to fork the repository, submit pull requests, or file issues.

---

## Roadmap

- Add support for fetching additional package details (e.g., last updated date, author, etc.).
- Support other sources like GitHub and PyPI.
- Add localization options for displaying fetched data.
