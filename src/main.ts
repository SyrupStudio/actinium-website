import './style.css'

const releasesApi = 'https://api.github.com/repos/SyrupStudio/Actinium/releases/latest'
const currentYear = new Date().getFullYear()
const platform = navigator.platform.toLowerCase()
const userAgent = navigator.userAgent.toLowerCase()
const detectedOs = platform.includes('win') || userAgent.includes('windows')
  ? 'Windows'
  : platform.includes('mac') || userAgent.includes('mac os')
    ? 'MacOS'
    : platform.includes('linux') || userAgent.includes('linux')
      ? 'Linux'
      : null

const downloadLabel = detectedOs
  ? `Download Actinium for ${detectedOs}`
  : 'Unsupported Operating System'

const sunIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path>
  </svg>`

const moonIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"></path>
  </svg>`

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="Actinium home">
      <img class="brand-logo" src="${import.meta.env.BASE_URL}logo.png" alt="" />
      <span>ACTINIUM</span>
    </a>
    <nav class="nav-links" aria-label="Main navigation">
      <a href="https://github.com/SyrupStudio/Actinium" target="_blank" rel="noopener noreferrer">Source Code</a>
      <a href="https://docs.syrupstudios.lol/Actinium/gettingStarted.html" target="_blank" rel="noopener noreferrer">Docs</a>
    </nav>
    <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch theme">
      <span class="theme-icon">${sunIcon}</span>
      <span class="theme-label">Light mode</span>
    </button>
  </header>

  <main>
    <section class="download-page" id="download">
      <div class="download-logo"><img src="${import.meta.env.BASE_URL}logo.png" alt="Actinium logo" /></div>
      <h1>Download<br><em>Actinium.</em></h1>
      <details class="download-picker">
        <summary class="download-main ${detectedOs ? '' : 'download-disabled'}">${downloadLabel}<span>⌄</span></summary>
        <div class="download-menu" aria-label="Other downloads">
          <a href="#" id="linux-tarball">Linux (.tar.gz)</a>
          <a href="#" id="macos-app">macOS App (Universal)</a>
          <a href="#" id="macos-dmg">macOS (.dmg)</a>
          <a href="#" id="windows-portable">Windows Portable</a>
          <a href="#" id="windows-msi">Windows Installer</a>
          <a href="#" id="linux-deb">Debian / Ubuntu (.deb)</a>
          <a href="#" id="linux-rpm">Fedora / RHEL (.rpm)</a>
        </div>
      </details>
      <a class="other-downloads" href="https://github.com/SyrupStudio/Actinium/releases/latest" target="_blank" rel="noopener noreferrer">Other downloads <span>↗</span></a>
      <p class="download-note">You’ll be redirected to the GitHub release page.</p>
    </section>
  </main>

  <footer>
    <span>© ${currentYear} Syrup Studios</span>
  </footer>
`

const toggle = document.querySelector<HTMLButtonElement>('#theme-toggle')!
const savedTheme = localStorage.getItem('actinium-theme')
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const getTheme = () => savedTheme ?? (systemTheme.matches ? 'dark' : 'light')

const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.dataset.theme = theme
  toggle.querySelector('.theme-icon')!.innerHTML = theme === 'dark' ? sunIcon : moonIcon
  toggle.querySelector('.theme-label')!.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode'
  toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`)
}

let currentTheme = getTheme() as 'light' | 'dark'
applyTheme(currentTheme)

toggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark'
  localStorage.setItem('actinium-theme', currentTheme)
  applyTheme(currentTheme)
})

systemTheme.addEventListener('change', (event) => {
  if (!localStorage.getItem('actinium-theme')) {
    currentTheme = event.matches ? 'dark' : 'light'
    applyTheme(currentTheme)
  }
})

const downloadMatchers: Record<string, (name: string) => boolean> = {
  'linux-tarball': (name) => name.endsWith('-linux.tar.gz'),
  'macos-app': (name) => name.endsWith('-macos-universal.zip'),
  'macos-dmg': (name) => name.endsWith('-macos.dmg'),
  'windows-portable': (name) => name.endsWith('-windows-portable.zip'),
  'windows-msi': (name) => name.endsWith('-x86_64.msi'),
  'linux-deb': (name) => name.endsWith('_amd64.deb'),
  'linux-rpm': (name) => name.endsWith('.x86_64.rpm'),
}

const platformDownloads: Record<string, string[]> = {
  Linux: ['linux-tarball', 'linux-deb', 'linux-rpm'],
  MacOS: ['macos-dmg', 'macos-app'],
  Windows: ['windows-portable', 'windows-msi'],
}

type GitHubRelease = {
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

const setupDownloads = async () => {
  try {
    const response = await fetch(releasesApi)
    if (!response.ok) {
      throw new Error('Could not get latest release')
    }

    const release = await response.json() as GitHubRelease
    for (const [id, matcher] of Object.entries(downloadMatchers)) {
      const element = document.getElementById(id)
      if (!(element instanceof HTMLAnchorElement)) continue

      if (!detectedOs || !platformDownloads[detectedOs].includes(id)) {
        element.style.display = 'none'
        continue
      }

      const asset = release.assets.find((file) => matcher(file.name))
      if (asset) {
        element.href = asset.browser_download_url
        element.target = '_blank'
        element.rel = 'noopener noreferrer'
      } else {
        element.style.display = 'none'
      }
    }
  } catch (error) {
    console.error('Actinium download error:', error)
  }
}

void setupDownloads()
