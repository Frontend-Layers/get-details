# Get Details

Fetch package information directly on your web page in an aesthetic manner

---
## Features

- Runs instantly via CDN `<script>` tag
- Config through a single `data-get-details` attribute
- Supports multiple elements
- Available as ES6 module
- Supports NPM (default), GitHub and PyPI
- Supports custom format reports

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

`data-get-details="[package-name][,][target-element][,][source],[{format}]"`

- **1st parameter** (required): Package name to fetch data for.
- **2nd parameter** (optional): Target element selector where the data will be inserted. If not provided, defaults to `#package-version`, `.current-version` or any element with the data-get-details attribute.
- **3rd parameter** (optional): The data source (default: `npm`). Can be `npm`, `github` or `pypi`.
- **4th parameter** (optional): Custom format, specified within `{}` for personalized reporting.

### ES6 Module Usage

Please install npm package

```shell
npm i get-details
```
Import and initialize in your JavaScript:

```javascript
  import getDetails from 'get-details/es.js';
  getDetails();
```

It still works with `data-*` but you can add parameters by functions argument

```javascript
getDetails({ packageName: 'package-name', target: 'target-element' });
```

---

## Custom Format

You can customize the format of the fetched package information by passing a specific format string in the `data-get-details` attribute. This format string can include placeholders that will be dynamically replaced with package data.

** Placeholders:**

- `%year`: The current year.
- `%copy`: The copyright symbol (©).
- `%name`: The package name.
- `%version`: The package version.
- `%description`: The package description.
- `%homepage`: The homepage URL of the package.
- `%author`: The author's name.
- `%license`: The license information.
- `%last-update`: The last update date of the package.
- `%stars`: The number of stars (for GitHub).
- `%forks`: The number of forks (for GitHub).
- `%language`: The programming language (for GitHub).
- `%repository`: The repository URL.
- `%maintainers`: The names of maintainers.
- `%downloads`: The download count for the package.
- `%release-date`: The release date of the package.
- `%release-notes`: The release notes for the latest version.
- `%owner`: The owner of the repository.
- `%requires`: Whether the package requires Python (for PyPI).

Example of custom format:

```html
  <footer class="footer">
    <p class="copy"></p>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/get-details" data-get-details="get-details,.copy,npm,{'%year %copy %name %version - (%license)'}"></script>
</body>
</html>
```

---

## Supported Sources

Currently supports fetching data from **NPM**, **GitHub** and **PyPI**.
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

- ? Add support for additional package details
- ? Implement GitLab and Bitbucket sources
- ? Add data formatting options
- ? ES6 console and report format
