(function () {
  let cachedElements = null;

  /**
   * Parses the value of the data-get-details attribute to extract configuration.
   *
   * @param {string} attrValue - The value of data-get-details attribute, containing package name, target element, source, and optionally format.
   * @returns {Object} - Configuration object containing package name, target element, source, and format (if provided).
   * @throws {Error} - If the package name is missing in the attribute value.
   */
  const parse = (attrValue) => {
    if (!attrValue) {
      return;
    }

    const formatMatch = attrValue.match(/{([^}]*)}/);

    if (!formatMatch) {
      const [pkg, target, source, format] = attrValue.split(',').map((s) => s.trim());
      if (!pkg) {
        throw new Error('Package name is required in data-get-details attribute');
      }
      return { pkg, target, source: source || 'npm', format: undefined };
    }

    const configPart = attrValue.slice(0, attrValue.indexOf('{')).trim();
    const format = formatMatch[1].trim();
    const [pkg, target, source] = configPart.split(',').map(s => s.trim());

    if (!pkg) {
      throw new Error('Package name is required in data-get-details attribute');
    }

    return {
      pkg,
      target,
      source: source || 'npm',
      format: format || undefined
    };
  };

  /**
   * Fetches the latest version of an NPM package.
   *
   * @param {string} pkgName - Name of the NPM package to fetch data for.
   * @returns {Promise<Object>} - A Promise resolving to an object containing package version and other metadata.
   * @throws {Error} - If the request fails or the package is not found.
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
      return;
    }
  };

  /**
   * Fetches the latest version of a PyPI package.
   *
   * @param {string} pkgName - Name of the PyPI package to fetch data for.
   * @returns {Promise<Object>} - A Promise resolving to an object containing package version and other metadata.
   * @throws {Error} - If the request fails or the package is not found.
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
      return;
    }
  };

  /**
   * Fetches the latest release version from a GitHub repository.
   *
   * @param {string} repoPath - Repository path in the format "owner/repo".
   * @returns {Promise<Object>} - A Promise resolving to an object containing release version and other metadata.
   * @throws {Error} - If the request fails or the repository is not found.
   */
  const fetchGitHubData = async (repoPath) => {
    try {
      const releaseResponse = await fetch(`https://api.github.com/repos/${repoPath}/releases/latest`);
      if (!releaseResponse.ok) {
        throw new Error(`HTTP error! status: ${releaseResponse.status}`);
      }
      const releaseData = await releaseResponse.json();

      const repoResponse = await fetch(`https://api.github.com/repos/${repoPath}`);
      if (!repoResponse.ok) {
        throw new Error(`HTTP error! status: ${repoResponse.status}`);
      }
      const repoData = await repoResponse.json();

      return {
        version: releaseData.tag_name.startsWith('v') ? releaseData.tag_name.slice(1) : releaseData.tag_name,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description || '',
        owner: repoData.owner.login,
        stars: repoData.stargazers_count,
        watchers: repoData.watchers_count,
        forks: repoData.forks_count,
        homepage: repoData.homepage || '',
        license: repoData.license?.name || '',
        lastUpdate: new Date(repoData.updated_at).toLocaleDateString(),
        language: repoData.language || '',
        releaseDate: new Date(releaseData.published_at).toLocaleDateString(),
        releaseAuthor: releaseData.author.login,
        releaseNotes: releaseData.body || '',
        openIssues: repoData.open_issues_count,
        defaultBranch: repoData.default_branch
      };
    } catch (error) {
      return;
    }
  };

  /**
   * Retrieves data from a specified source (NPM, PyPI, GitHub).
   *
   * @param {string} source - The source from which to fetch data (e.g., "npm", "pypi", "github").
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
      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  };

  /**
   * Processes an element with the data-get-details attribute.
   * Uses data-set-details attribute for deduplication.
   */
  const action = async (el) => {
    const elAttr = el.getAttribute('data-get-details');
    const { pkg, target, source, format } = parse(elAttr);

    let elTargets = [];
    if (el.tagName !== 'SCRIPT' && !target) {
      elTargets = [el];
    } else {
      elTargets = target ? Array.from(document.querySelectorAll(target)) : Array.from(document.querySelectorAll('#package_version, .current-version'));
    }

    if (!elTargets.length) {
      throw new Error('No target elements found');
    }

    try {
      const data = await getData(source, pkg);
      let report = getReport(data, format);

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
   * Generates a report based on the provided data and format.
   *
   * @param {Object} data - The data object containing package information.
   * @param {string} format - The format string that may include variables to be replaced.
   * @returns {string} - The formatted report string.
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
   * Initializes the package version fetcher.
   */
  const init = async () => {
    if (cachedElements === null) {
      cachedElements = document.querySelectorAll('[data-get-details]');
    }
    if (!cachedElements.length) return;

    await Promise.all(
      Array.from(cachedElements).map(async (el) => {
        try {
          await action(el);
        } catch (err) {
          console.error('Error during element initialization:', err);
        }
      })
    );
  };

  // Auto-initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
})();