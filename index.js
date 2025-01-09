(function () {
  /**
   * Extract parameters from a given <script> element's data-* attributes
   *
   * @param {HTMLScriptElement} scriptElement - The script element to extract parameters from
   * @returns {Object} Object containing package name, target element, and data source
   */
  function getScriptParams(scriptElement) {
    return {
      package: scriptElement.getAttribute('data-pack'), // The name of the package
      target: scriptElement.getAttribute('data-target') || '#version', // The target element selector
      source: scriptElement.getAttribute('data-src') || 'npm' // The data source (default is 'npm')
    };
  }

  /**
   * Insert fetched data into the target element on the web page
   *
   * @param {string} elId - The CSS selector of the target element
   * @param {string} version - The version or data to insert into the target element
   */
  function insertData(elId, version) {
    const elTarget = document.querySelector(elId); // Find the target element
    if (elTarget) {
      elTarget.innerHTML = `${version}`; // Insert the version or data into the element
    }
  }

  /**
   * Fetch the latest version of a package from the NPM registry
   *
   * @param {string} packageName - The name of the NPM package
   * @returns {Promise<Object>} A promise resolving to an object with the package version
   */
  function fetchNpmData(packageName) {
    const url = `https://registry.npmjs.org/${packageName}/latest`; // NPM API endpoint
    return fetch(url)
      .then(response => response.json()) // Parse the JSON response
      .then(data => ({
        version: data.version, // Extract the version from the response
      }))
      .catch(() => ({
        version: 'Error fetching version', // Handle errors gracefully
      }));
  }

  /**
   * Process a single <script> element with data-* attributes
   *
   * @param {HTMLScriptElement} scriptElement - The script element to process
   */
  function processScript(scriptElement) {
    const { package, target, source } = getScriptParams(scriptElement); // Extract parameters

    if (source === 'npm') { // Check if the source is 'npm'
      fetchNpmData(package).then(({ version }) => {
        insertData(target, version); // Insert the fetched version into the target element
        console.log(`Package: ${package}, Version: ${version}, Target: ${target}`); // Debug information
      });
    } else {
      console.warn(`Source "${source}" not supported for script:`, scriptElement); // Handle unsupported sources
    }
  }

  /**
   * Main initialization function
   * Finds all <script> elements with specific attributes and processes them
   */
  function init() {
    const scripts = document.querySelectorAll('script[data-pack]'); // Find all <script> elements with a `data-pack` attribute
    if (!scripts) return;

    scripts.forEach(scriptElement => {
      processScript(scriptElement); // Process each script individually
    });
  }

  // Automatically run the initialization function on script load
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
})();
