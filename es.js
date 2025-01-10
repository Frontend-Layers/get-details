/**
 * Module for fetching and displaying package information from various sources.
 * Supports any HTML element with data-get-details attribute for configuration or direct invocation.
 */

/**
 * Parse the data-get-details attribute value
 *
 * @param {string} attrValue - The value of data-get-details attribute
 * @returns {Object} Configuration object containing package name, target element, and data source
 */
const parseAttribute = (attrValue) => {
  const [pkg, target, source] = attrValue.split(',').map(s => s.trim());
  if (!pkg) {
    throw new Error('Package name is required in data-get-details attribute');
  }
  return { pkg, target, source: source || 'npm' };
};

/**
 * Fetch the latest version of a package from NPM registry
 *
 * @param {string} pkgName - Name of the NPM package
 * @returns {Promise<Object>} Promise resolving to object containing package version
 */
const fetchNpmData = async (pkgName) => {
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkgName}/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { version: data.version };
  } catch (error) {
    console.error('Fetching npm data failed:', error);
    return { version: 'Error fetching version' };
  }
};

/**
 * Fetch the latest version of a package from PyPI
 *
 * @param {string} pkgName - Name of the PyPI package
 * @returns {Promise<Object>} Promise resolving to object containing package version
 */
const fetchPyPIData = async (pkgName) => {
  try {
    const response = await fetch(`https://pypi.org/pypi/${pkgName}/json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { version: data.info.version };
  } catch (error) {
    console.error('Fetching PyPI data failed:', error);
    return { version: 'Error fetching version' };
  }
};

/**
 * Fetch the latest release version from GitHub
 *
 * @param {string} repoPath - Repository path in format "owner/repo"
 * @returns {Promise<Object>} Promise resolving to object containing release version
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
    return { version };
  } catch (error) {
    console.error('Fetching GitHub data failed:', error);
    return { version: 'Error fetching version' };
  }
};

/**
 * Get data from the specified source
 *
 * @param {string} source - Source name (npm, pypi, or github)
 * @param {string} pkg - Package or repository name
 * @returns {Promise<Object>} Promise resolving to object containing version
 */
const getVersionData = async (source, pkg) => {
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
 * Process a single element with data-get-details attribute or direct parameters
 *
 * @param {HTMLElement} element - Element to process
 * @param {Object} params - Direct parameters to override element's data attributes
 */
const processElement = async (el, params = {}) => {
  let elAttr = el.getAttribute('data-get-details');
  const elTag = el.tagName;

  // If direct parameters are provided, use them instead of element attributes
  if (params.packageName) {
    elAttr = [params.packageName, params.target || '', params.source || ''].join(',');
  }

  const { pkg: packageName, target, source } = parseAttribute(elAttr);
  let elTarget = '';

  if (elTag !== 'SCRIPT' && !target) {
    elTarget = el;
  } else {
    elTarget = target ? document.querySelector(target) : document.querySelector('#package_version, .current-version');
  }

  if (!elTarget) {
    throw new Error('Target element is absent');
  }

  try {
    const { version } = await getVersionData(source, packageName);
    elTarget.innerHTML = version;
  } catch (error) {
    console.error('Error processing element:', error);
    elTarget.innerHTML = error.message || 'Error fetching version';
  }
};

/**
 * Initialize the package version fetcher
 * Finds all elements with data-get-details attribute and processes them
 * or process single element with direct parameters
 *
 * @param {Object} options - Options object with packageName, target, and source
 * @param {string} options.packageName - Package name or repository path
 * @param {string} [options.target=null] - Target element selector
 * @param {string} [options.source='npm'] - Source type: 'npm', 'pypi', or 'github'
 */
const main = async ({ packageName, target = null, source = 'npm' } = {}) => {
  if (!packageName) {
    throw new Error('Package name is required');
  }

  if (packageName) {
    const tempElement = document.createElement('div');
    tempElement.setAttribute('data-get-details', `${packageName},${target},${source}`);
    document.body.appendChild(tempElement);
    await processElement(tempElement, { packageName, target, source });
    document.body.removeChild(tempElement);
  } else {
    const elements = document.querySelectorAll('[data-get-details]');
    if (elements.length && target) {
      await Promise.all(Array.from(elements).map(el => processElement(el)));
    }
  }
};

export default main;