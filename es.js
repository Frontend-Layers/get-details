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
 * Fetches the latest release version from a GitLab repository.
 *
 * @param {string} repoPath - Repository path in the format "owner/repo" or "group/subgroup/repo".
 * @returns {Promise<Object>} - A Promise resolving to an object containing release version and other metadata.
 * @throws {Error} - If the request fails or the repository is not found.
 */
const fetchGitLabData = async (repoPath) => {
  try {
    // URL encode the repository path
    const encodedPath = encodeURIComponent(repoPath);

    // Fetch latest release
    const releaseResponse = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/releases/`);
    if (!releaseResponse.ok) {
      throw new Error(`HTTP error! status: ${releaseResponse.status}`);
    }
    const releases = await releaseResponse.json();
    const latestRelease = releases[0]; // GitLab returns releases in descending order

    // Fetch repository details
    const repoResponse = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}`);
    if (!repoResponse.ok) {
      throw new Error(`HTTP error! status: ${repoResponse.status}`);
    }
    const repoData = await repoResponse.json();

    return {
      version: latestRelease?.tag_name?.startsWith('v') ? latestRelease.tag_name.slice(1) : latestRelease?.tag_name || '',
      name: repoData.name,
      fullName: repoData.path_with_namespace,
      description: repoData.description || '',
      owner: repoData.namespace.name,
      stars: repoData.star_count,
      forks: repoData.forks_count,
      homepage: repoData.web_url || '',
      license: repoData.license?.name || '',
      lastUpdate: new Date(repoData.last_activity_at).toLocaleDateString(),
      language: repoData.predominant_language || '',
      releaseDate: latestRelease ? new Date(latestRelease.released_at).toLocaleDateString() : '',
      releaseAuthor: latestRelease?.author?.name || '',
      releaseNotes: latestRelease?.description || '',
      openIssues: repoData.open_issues_count,
      defaultBranch: repoData.default_branch
    };
  } catch (error) {
    return;
  }
};

/**
 * Retrieves data from a specified source (NPM, PyPI, GitHub, GitLab, BitBucket).
 *
 * @param {string} source - The source from which to fetch data.
 * @param {string} pkg - The package or repository name.
 * @returns {Promise<Object>} - A Promise resolving to an object containing version and other metadata.
 * @throws {Error} - If the source is unsupported or the request fails.
 */
const getData = async (source, pkg) => {
  switch (source.toLowerCase()) {
    case 'npm':
      return fetchNpmData(pkg);
    case 'pypi':
      return fetchPyPIData(pkg);
    case 'github':
      return fetchGitHubData(pkg);
    case 'gitlab':
      return fetchGitLabData(pkg);
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
 * @returns {Promise<Object|void>} Returns package data if str is true, otherwise void
 */
const action = async (el, params = {}) => {
  let elAttr = el.getAttribute('data-get-details');

  // If direct parameters are provided, use them instead of element attributes
  if (params.packageName) {
    elAttr = [params.packageName, params.target || '', params.source || '', params.format || ''].join(',');
  }

  const { pkg: packageName, target, source, format } = parse(elAttr);

  // If str is true, just return the data
  if (params.str) {
    const data = await getData(source, packageName);
    return format ? getReport(data, format) : data;
  }

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
 * If str is true, returns the package data instead of processing DOM elements.
 *
 * @param {Object} options - Options object
 * @param {string} options.packageName - Package name or repository path
 * @param {string} [options.target=null] - Target element selector
 * @param {string} [options.source='npm'] - Source type: 'npm', 'pypi', or 'github'
 * @param {string} [options.format=''] - Format string to generate report
 * @param {boolean} [options.str=false] - If true, returns data instead of processing DOM
 * @returns {Promise<Object|void>} Returns package data if str is true, otherwise void
 */
const main = async ({ packageName, target = null, source = 'npm', format = '', str = false } = {}) => {
  if (!packageName) {
    throw new Error('Package name is required');
  }

  if (packageName) {
    const elTmp = document.createElement('div');
    elTmp.setAttribute('data-get-details', `${packageName},${target},${source},${format}`);

    if (str) {
      return action(elTmp, { packageName, target, source, format, str });
    }

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