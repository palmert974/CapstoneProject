/* =============================================
   DiscoverUs — App Logic
   iTunes Search API · No auth required
   ============================================= */

const ITUNES = 'https://itunes.apple.com/search';
const CORS   = 'https://corsproxy.io/?';

let currentTrack  = null;
let allTracks     = [];
let filteredTracks = [];
let currentQuery  = '';
let currentGenre  = '';
let displayedCount = 0;
const PAGE_SIZE    = 24;

const audio = document.getElementById('globalAudio');

/* ─── Utility ─── */
function itunesUrl(term, limit = 50) {
  return `${ITUNES}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}&country=US`;
}

async function fetchTracks(term, limit = 50) {
  try {
    const res  = await fetch(itunesUrl(term, limit));
    if (!res.ok) throw new Error('network');
    const data = await res.json();
    return (data.results || []).filter(t => t.previewUrl && t.artworkUrl100);
  } catch {
    return [];
  }
}

function artSrc(url, size = 300) {
  return url ? url.replace('100x100', `${size}x${size}`) : '';
}

function truncate(str, max = 30) {
  return str && str.length > max ? str.slice(0, max) + '…' : str || '—';
}

/* ─── Audio Player ─── */
let progressInterval = null;

function playTrack(track) {
  if (!track?.previewUrl) return;
  if (currentTrack?.trackId === track.trackId && !audio.paused) {
    pauseAudio();
    return;
  }
  currentTrack = track;
  audio.src = track.previewUrl;
  audio.play().catch(() => {});
  showMiniPlayer(track);
  updatePlayIcons(track.trackId, true);
  startProgressTracking();
}

function pauseAudio() {
  audio.pause();
  updatePlayIcons(null, false);
  clearInterval(progressInterval);
  if (document.getElementById('miniPlayBtn'))
    document.getElementById('miniPlayBtn').textContent = '▶';
}

function updatePlayIcons(trackId, playing) {
  // hero player
  const heroBtn  = document.getElementById('heroPlayBtn');
  const heroIcon = document.getElementById('heroPlayIcon');
  if (heroBtn && heroIcon) {
    const isHero = currentTrack?.trackId === trackId;
    heroIcon.textContent = (playing && isHero) ? '⏸' : '▶';
  }
  // track cards
  document.querySelectorAll('.track-card').forEach(card => {
    const id = Number(card.dataset.trackId);
    card.classList.toggle('track-card--playing', playing && id === trackId);
    const badge = card.querySelector('.track-card__playing-badge');
    if (badge) badge.style.display = (playing && id === trackId) ? '' : 'none';
    const btn = card.querySelector('.track-card__play');
    if (btn) btn.textContent = (playing && id === trackId) ? '⏸' : '▶';
  });
}

function startProgressTracking() {
  clearInterval(progressInterval);
  const bar = document.getElementById('heroProgress');
  progressInterval = setInterval(() => {
    if (!audio || audio.paused) { clearInterval(progressInterval); return; }
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
    const miniBtn = document.getElementById('miniPlayBtn');
    if (miniBtn) miniBtn.textContent = '⏸';
  }, 300);
}

audio.addEventListener('ended', () => {
  updatePlayIcons(null, false);
  clearInterval(progressInterval);
  const bar = document.getElementById('heroProgress');
  if (bar) bar.style.width = '0%';
  const miniBtn = document.getElementById('miniPlayBtn');
  if (miniBtn) miniBtn.textContent = '▶';
});

/* ─── Mini Player ─── */
function showMiniPlayer(track) {
  const mp = document.getElementById('miniPlayer');
  if (!mp) return;
  mp.style.display = 'flex';
  document.getElementById('miniTrackName').textContent  = truncate(track.trackName, 28);
  document.getElementById('miniArtistName').textContent = truncate(track.artistName, 22);
  const art = document.getElementById('miniArt');
  if (track.artworkUrl100) {
    art.innerHTML = `<img src="${artSrc(track.artworkUrl100, 60)}" alt="${track.artistName}" />`;
  } else {
    art.textContent = '♪';
  }
}

function toggleMiniPlay() {
  if (audio.paused) {
    audio.play().catch(() => {});
    document.getElementById('miniPlayBtn').textContent = '⏸';
    updatePlayIcons(currentTrack?.trackId, true);
    startProgressTracking();
  } else {
    pauseAudio();
  }
}

function closeMiniPlayer() {
  pauseAudio();
  const mp = document.getElementById('miniPlayer');
  if (mp) mp.style.display = 'none';
}

/* ─── Track Card Builder ─── */
function buildTrackCard(track) {
  const el = document.createElement('div');
  el.className = 'track-card';
  el.dataset.trackId = track.trackId;
  el.dataset.artist = track.artistName || '';
  el.dataset.track  = track.trackName  || '';
  const art = artSrc(track.artworkUrl100, 300);
  const genre = truncate(track.primaryGenreName || 'Music', 14);
  el.innerHTML = `
    <div class="track-card__art">
      <img src="${art}" alt="${track.artistName}" loading="lazy" />
      <div class="track-card__overlay">
        <button class="track-card__play" aria-label="Play preview">▶</button>
      </div>
      <span class="track-card__playing-badge" style="display:none;">Playing</span>
    </div>
    <div class="track-card__body">
      <div class="track-card__track">${truncate(track.trackName, 28)}</div>
      <div class="track-card__artist">${truncate(track.artistName, 22)}</div>
      <span class="track-card__genre">${genre}</span>
    </div>
  `;
  el.addEventListener('click', () => playTrack(track));
  return el;
}

/* ─── Artist Card Builder ─── */
function buildArtistCard(artistName, genreName, art) {
  const el = document.createElement('div');
  el.className = 'artist-card';
  const avatarHtml = art
    ? `<img class="artist-card__avatar" src="${artSrc(art, 80)}" alt="${artistName}" />`
    : `<div class="artist-card__avatar-placeholder">🎤</div>`;
  el.innerHTML = `
    ${avatarHtml}
    <div class="artist-card__name">${truncate(artistName, 20)}</div>
    <div class="artist-card__genre">${truncate(genreName || 'Music', 18)}</div>
    <button class="artist-card__btn" onclick="goToArtist('${artistName.replace(/'/g, "\\'")}')">View Tracks</button>
  `;
  return el;
}

function goToArtist(name) {
  window.location.href = `browse.html?genre=${encodeURIComponent(name)}`;
}

/* ─── HOME PAGE ─── */
async function initHome() {
  await Promise.all([
    loadHeroTrack(),
    loadTrending(),
    loadSpotlight(),
  ]);
}

async function loadHeroTrack() {
  const terms = ['SZA','Beyonce','Doja Cat','Drake','Kendrick Lamar'];
  const term  = terms[Math.floor(Math.random() * terms.length)];
  const tracks = await fetchTracks(term, 10);
  if (!tracks.length) return;
  const track = tracks[Math.floor(Math.random() * tracks.length)];

  const nameEl   = document.getElementById('heroTrackName');
  const artistEl = document.getElementById('heroArtistName');
  const artEl    = document.getElementById('heroArt');
  if (nameEl)   nameEl.textContent   = truncate(track.trackName, 22);
  if (artistEl) artistEl.textContent = track.artistName;
  if (artEl) {
    artEl.innerHTML = `<img src="${artSrc(track.artworkUrl100, 300)}" alt="${track.artistName}" />`;
  }
  // Store for hero play button
  window._heroTrack = track;
}

function toggleHeroPlay() {
  const track = window._heroTrack;
  if (!track) return;
  if (currentTrack?.trackId === track.trackId && !audio.paused) {
    pauseAudio();
  } else {
    playTrack(track);
    const icon = document.getElementById('heroPlayIcon');
    if (icon) icon.textContent = '⏸';
  }
}

async function loadTrending() {
  const queries = ['hip hop 2024','r&b soul','afrobeats','pop hits'];
  const results = await Promise.all(queries.map(q => fetchTracks(q, 15)));
  const merged  = results.flat().sort(() => Math.random() - 0.5).slice(0, 8);

  const grid = document.getElementById('trendingGrid');
  if (!grid) return;
  grid.innerHTML = '';
  merged.forEach(t => grid.appendChild(buildTrackCard(t)));
}

async function loadSpotlight() {
  const artists = [
    { name: 'Rema', genre: 'Afrobeats' },
    { name: 'Summer Walker', genre: 'R&B' },
    { name: 'Burna Boy', genre: 'Afropop' },
  ];
  const grid = document.getElementById('spotlightGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const fetches = await Promise.all(artists.map(a => fetchTracks(a.name, 3)));
  artists.forEach((a, i) => {
    const art = fetches[i][0]?.artworkUrl100 || null;
    grid.appendChild(buildArtistCard(a.name, a.genre, art));
  });
}

/* ─── BROWSE PAGE ─── */
async function initBrowse(genre) {
  currentGenre = genre;
  currentQuery = genre;
  displayedCount = 0;
  setResultsCount('Loading…');
  const term = genre || 'hip hop r&b afrobeats pop';
  allTracks = await fetchTracks(term, 100);
  filteredTracks = allTracks;
  renderBrowseGrid();
}

function renderBrowseGrid() {
  const grid = document.getElementById('browseGrid');
  if (!grid) return;
  if (!filteredTracks.length) {
    grid.innerHTML = '<p style="color:var(--text-2);grid-column:1/-1;text-align:center;padding:3rem;">No tracks found. Try a different search.</p>';
    setResultsCount('0 tracks');
    document.getElementById('loadMoreBtn').style.display = 'none';
    return;
  }
  grid.innerHTML = '';
  const slice = filteredTracks.slice(0, PAGE_SIZE);
  displayedCount = slice.length;
  slice.forEach(t => grid.appendChild(buildTrackCard(t)));
  setResultsCount(`${filteredTracks.length} tracks found`);
  const btn = document.getElementById('loadMoreBtn');
  if (btn) btn.style.display = filteredTracks.length > PAGE_SIZE ? '' : 'none';
}

function loadMore() {
  const grid = document.getElementById('browseGrid');
  if (!grid) return;
  const next = filteredTracks.slice(displayedCount, displayedCount + PAGE_SIZE);
  next.forEach(t => grid.appendChild(buildTrackCard(t)));
  displayedCount += next.length;
  if (displayedCount >= filteredTracks.length) {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = 'none';
  }
}

function setResultsCount(msg) {
  const el = document.getElementById('resultsCount');
  if (el) el.textContent = msg;
}

let searchTimeout = null;
function handleSearch(val) {
  currentQuery = val;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (!val.trim()) {
      filteredTracks = allTracks;
    } else {
      const q = val.toLowerCase();
      filteredTracks = allTracks.filter(t =>
        t.trackName?.toLowerCase().includes(q) ||
        t.artistName?.toLowerCase().includes(q) ||
        t.collectionName?.toLowerCase().includes(q)
      );
    }
    displayedCount = 0;
    renderBrowseGrid();
  }, 300);
}

async function triggerSearch() {
  const val = document.getElementById('searchInput')?.value || '';
  if (!val.trim()) return;
  setResultsCount('Searching…');
  allTracks = await fetchTracks(val, 100);
  filteredTracks = allTracks;
  displayedCount = 0;
  renderBrowseGrid();
  // Reset pills
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('pill--active'));
  const allPill = document.querySelector('[data-genre=""]');
  if (allPill) allPill.classList.add('pill--active');
}

function filterGenre(btn, genre) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('pill--active'));
  btn.classList.add('pill--active');
  initBrowse(genre);
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
}

function sortTracks(by) {
  if (by === 'artist') {
    filteredTracks = [...filteredTracks].sort((a, b) =>
      (a.artistName || '').localeCompare(b.artistName || ''));
  } else if (by === 'track') {
    filteredTracks = [...filteredTracks].sort((a, b) =>
      (a.trackName || '').localeCompare(b.trackName || ''));
  } else {
    filteredTracks = [...allTracks];
    const q = currentQuery;
    if (q) {
      filteredTracks = filteredTracks.filter(t =>
        t.trackName?.toLowerCase().includes(q.toLowerCase()) ||
        t.artistName?.toLowerCase().includes(q.toLowerCase())
      );
    }
  }
  displayedCount = 0;
  renderBrowseGrid();
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('trendingGrid')) {
    initHome();
  }
  // Browse init is handled by inline script after DOM load (reads URL params)
});
