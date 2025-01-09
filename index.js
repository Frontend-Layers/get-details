(function () {
  let cachedElements = null;

  /**
   * Module for fetching and displaying package information from various sources.
   * Supports any HTML element with data-get-details attribute for configuration.
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
   * Process a single element with data-get-details attribute
   *
   * @param {HTMLElement} element - Element to process
   */
  const processElement = async (el) => {
    const elAttr = el.getAttribute('data-get-details');
    const elTag = el.tagName;

    const { pkg, target, source } = parseAttribute(elAttr);
    let elTarget = '';

    if (elTag !== 'SCRIPT' && !target) {
      elTarget = el;
    } else {
      elTarget = target ? document.querySelector(target) : document.querySelector('#package_version');
    }

    if (!elTarget) {
      throw new Error(`Target element is absent`);
    }

    if (source === 'npm') {
      try {
        const { version } = await fetchNpmData(pkg);
        elTarget.innerHTML = version;
      } catch (error) {
        console.error('Error processing element:', error);
        elTarget.innerHTML = 'Error fetching version';
      }
    } else {
      console.warn(`Source "${source}" not supported for element:`, el);
      elTarget.innerHTML = 'Unsupported source';
    }
  };

  /**
   * Initialize the package version fetcher
   * Finds all elements with data-get-details attribute and processes them
   */
  const init = async () => {
    if (cachedElements === null) {
      cachedElements = document.querySelectorAll('[data-get-details]');
    }

    if (!cachedElements.length) return;

    await Promise.all(Array.from(cachedElements).map(el => processElement(el)));
  };

  // Optional: Auto-initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
})();