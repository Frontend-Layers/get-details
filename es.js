/**
 * Module for fetching and displaying package information from various sources.
 * Supports any HTML element with data-get-details attribute for configuration or direct invocation.
 */

/**
 * Parse the data-get-details attribute value and extract configuration.
 *
 * @param {string} attrValue - The value of data-get-details attribute
 * @returns {Object} Configuration object containing package name, target element, and data source
 * @throws {Error} Throws an error if package name is missing in the attribute value
 */
const parse = (attrValue) => {
  const formatMatch = attrValue.match(/{([^}]*)}/);

  let pkg, target, source, format;

  if (formatMatch) {
    const configPart = attrValue.slice(0, attrValue.indexOf('{')).trim();
    format = formatMatch[1].trim();
    [pkg, target, source] = configPart.split(',').map(s => s.trim());
  } else {
    [pkg, target, source, format] = attrValue.split(',').map(s => s.trim());
  }

  if (!pkg) {
    throw new Error('Package name is required in data-get-details attribute');
  }

  return { pkg, target, source: source || 'npm', format };
};

/**
 * Fetch the latest version of a package from the NPM registry.
 *
 * @param {string} pkgName - Name of the NPM package
 * @returns {Promise<Object>} Promise resolving to an object containing package version and metadata
 */
const fetchNpmData = async (pkgName) => {
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkgName}/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      version: data.version,
      name: data.name,
      description: data.description || '',
      author: typeof data.author === 'object' ? data.author.name : data.author || '',
      license: data.license || '',
      homepage: data.homepage || '',
      repository: data.repository?.url || '',
      lastUpdate: new Date(data.time?.modified || '').toLocaleDateString(),
      keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : '',
      maintainers: Array.isArray(data.maintainers) ? data.maintainers.map(m => m.name).join(', ') : '',
      dependencies: Object.keys(data.dependencies || {}).length || 0
    };
  } catch (error) {
    console.error('Fetching npm data failed:', error);
    return {};
  }
};

/**
 * Fetch the latest version of a package from PyPI.
 *
 * @param {string} pkgName - Name of the PyPI package
 * @returns {Promise<Object>} Promise resolving to an object containing package version and metadata
 */
const fetchPyPIData = async (pkgName) => {
  try {
    const response = await fetch(`https://pypi.org/pypi/${pkgName}/json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const info = data.info;

    return {
      version: info.version,
      name: info.name,
      description: info.summary || '',
      author: info.author || '',
      authorEmail: info.author_email || '',
      license: info.license || '',
      homepage: info.home_page || info.project_url || '',
      repository: info.project_urls?.Source || '',
      lastUpdate: new Date(info.last_serial ? info.last_serial * 1000 : '').toLocaleDateString(),
      keywords: info.keywords || '',
      maintainers: info.maintainer || '',
      requiresPython: info.requires_python || '',
      downloads: {
        lastDay: data.urls?.[0]?.downloads || 0,
        lastMonth: info.downloads?.last_month || 0,
        lastWeek: info.downloads?.last_week || 0
      }
    };
  } catch (error) {
    console.error('Fetching PyPI data failed:', error);
    return {};
  }
};

/**
 * Fetch the latest release version from GitHub.
 *
 * @param {string} repoPath - Repository path in format "owner/repo"
 * @returns {Promise<Object>} Promise resolving to an object containing release version and metadata
 */
const fetchGitHubData = async (repoPath) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoPath}/releases/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Remove 'v' prefix if present
    const version = data.tag_name.startsWith('v') ? data.tag_name.slice(1) : data.tag_name;
    return {
      version,
      name: data.name || '',
      releaseNotes: data.body || ''
    };
  } catch (error) {
    console.error('Fetching GitHub data failed:', error);
    return {};
  }
};

/**
 * Get data from the specified source (npm, pypi, or github).
 *
 * @param {string} source - Source name (npm, pypi, or github)
 * @param {string} pkg - Package or repository name
 * @returns {Promise<Object>} Promise resolving to an object containing version and metadata
 */
const getData = async (source, pkg) => {
  switch (source.toLowerCase()) {
    case 'npm':
      return fetchNpmData(pkg);
    case 'pypi':
      return fetchPyPIData(pkg);
    case 'github':
      return fetchGitHubData(pkg);
    default:
      throw new Error(`Unsupported source: ${source}`);
  }
};

/**
 * Generate a report based on the provided data and format.
 *
 * @param {Object} data - The data to generate the report from
 * @param {string} format - The format string with placeholders to be replaced
 * @returns {string} The generated report with replaced placeholders
 */
function getReport(data, format) {
  if (!format) {
    return data.version || '';
  }

  const variables = {
    '%year': new Date().getFullYear(),
    '%copy': '©',
    '%name': data.name || '',
    '%version': data.version || '',
    '%description': data.description || '',
    '%homepage': data.homepage || '',
    '%author': data.author || '',
    '%license': data.license || '',
    '%last-update': data.lastUpdate || '',
    '%stars': data.stars || '',
    '%forks': data.forks || '',
    '%language': data.language || '',
    '%repository': data.repository || '',
    '%maintainers': data.maintainers || '',
    '%downloads': data.downloads?.lastMonth || '',
    '%release-date': data.releaseDate || '',
    '%release-notes': data.releaseNotes || '',
    '%owner': data.owner || '',
    '%requires': data.requiresPython || ''
  };

  let result = format;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(key, 'gi');
    result = result.replace(regex, value);
  }

  result = result
    // Replace multiple spaces with one
    .replace(/\s+/g, ' ')
    // Remove spaces before commas
    .replace(/\s+,/g, ',')
    // Remove repeating commas
    .replace(/,+/g, ',')
    // Remove commas at the beginning and end
    .trim()
    .replace(/^,+|,+$/g, '')
    // Remove empty parentheses
    .replace(/\(\s*\)/g, '');

  return result;
}

/**
 * Process a single element with data-get-details attribute or direct parameters.
 *
 * @param {HTMLElement} el - Element to process
 * @param {Object} params - Direct parameters to override element's data attributes
 */
const action = async (el, params = {}) => {
  let elAttr = el.getAttribute('data-get-details');

  // If direct parameters are provided, use them instead of element attributes
  if (params.packageName) {
    elAttr = [params.packageName, params.target || '', params.source || '', params.format || ''].join(',');
  }

  const { pkg: packageName, target, source, format } = parse(elAttr);
  let elTargets = target ? document.querySelectorAll(target) : document.querySelectorAll('#package_version, .current-version');

  if (!elTargets.length) {
    return;
  }

  try {
    const data = await getData(source, packageName);
    const report = getReport(data, format);

    elTargets.forEach((targetEl) => {
      // Skip if element was already processed
      if (!targetEl.dataSetDetails) {
        targetEl.innerHTML = report;
        // Mark element as processed
        targetEl.dataSetDetails = true;
      }
    });
  } catch (error) {
    console.error('Error processing element:', error);
  }
};

/**
 * Initialize the package version fetcher.
 * Finds all elements with data-get-details attribute and processes them.
 *
 * @param {Object} options - Options object with packageName, target, and source
 * @param {string} options.packageName - Package name or repository path
 * @param {string} [options.target=null] - Target element selector
 * @param {string} [options.source='npm'] - Source type: 'npm', 'pypi', or 'github'
 * @param {string} [options.format=''] - Format string to generate report
 */
const main = async ({ packageName, target = null, source = 'npm', format = '' } = {}) => {
  if (!packageName) {
    throw new Error('Package name is required');
  }

  if (packageName) {
    const elTmp = document.createElement('div');
    elTmp.setAttribute('data-get-details', `${packageName},${target},${source},${format}`);
    document.body.appendChild(elTmp);
    await action(elTmp, { packageName, target, source, format });
    document.body.removeChild(elTmp);
  } else {
    const elements = document.querySelectorAll('[data-get-details]');
    if (elements.length && target) {
      await Promise.all(Array.from(elements).map(el => action(el)));
    }
  }
};

export default main;
