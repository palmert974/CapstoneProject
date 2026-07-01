import { Link } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import "./BrowseArtist.scss";

const CURATED_ARTISTS = [
  "Rema",
  "Burna Boy",
  "Summer Walker",
  "WizKid",
  "SZA",
  "J. Cole",
];

// Home and Browse both mount this component, so cache results across mounts
// to avoid doubling up on iTunes' undocumented per-IP rate limit.
const _artistCache = new Map();

async function fetchArtistTracks(artist) {
  if (_artistCache.has(artist)) return _artistCache.get(artist);
  // Proxied through our own /api/tracks (see api/tracks.js) instead of
  // calling itunes.apple.com directly from the browser, which was
  // intermittently blocked by inconsistent CORS headers from Apple's CDN.
  const url = `/api/tracks?term=${encodeURIComponent(
    artist
  )}&media=music&entity=song&limit=6&country=US`;
  const res = await axios.get(url);
  const tracks = res.data.results
    .filter((r) => r.previewUrl && r.artworkUrl100)
    .slice(0, 4)
    .map((r) => ({
      name: r.trackName,
      artist: r.artistName,
      image: r.artworkUrl100.replace("100x100", "300x300"),
      preview: r.previewUrl,
      id: r.artistId,
    }));
  _artistCache.set(artist, tracks);
  return tracks;
}

function BrowseArtist() {
  const [artistSections, setArtistSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const audioRef = useRef(null);

  const loadArtists = useCallback(async () => {
    setLoading(true);
    setError(false);
    const outcomes = await Promise.allSettled(
      CURATED_ARTISTS.map((name) =>
        fetchArtistTracks(name).then((tracks) => ({ name, tracks }))
      )
    );
    const sections = outcomes
      .filter((o) => o.status === "fulfilled")
      .map((o) => o.value)
      .filter((s) => s.tracks.length > 0);
    // Only show the error state if every artist failed to load —
    // one flaky/rate-limited request shouldn't blank the whole section.
    if (sections.length === 0 && outcomes.length > 0) {
      setError(true);
    } else {
      setArtistSections(sections);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    audioRef.current.src = currentTrack.preview;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying]);

  function handleCardClick(track, key) {
    if (currentTrack?.preview === track.preview) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  }

  function handleSongEnd() {
    setIsPlaying(false);
  }

  if (loading) {
    return (
      <div className="browse-artist browse-artist--loading">
        <p>Loading artists…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="browse-artist browse-artist--error">
        <p>Could not load tracks.</p>
        <button className="retry-btn" onClick={loadArtists}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="browse-artist">
      <audio ref={audioRef} onEnded={handleSongEnd} preload="auto" />
      {artistSections.map(({ name, tracks }) => (
        <div className="artist-section" key={name}>
          <h3 className="artist-section__title">{name}</h3>
          <div className="cards">
            {tracks.map((track, i) => {
              const key = `${name}-${i}`;
              const isActive = currentTrack?.preview === track.preview;
              return (
                <div
                  className={`card${isActive ? " card--active" : ""}`}
                  key={key}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => handleCardClick(track, key)}
                >
                  {(hoveredKey === key || isActive) && (
                    <div className="player">
                      <button>
                        {isActive && isPlaying ? "⏸" : "▶"}
                      </button>
                    </div>
                  )}
                  <img
                    src={track.image}
                    alt={`${track.artist} — ${track.name}`}
                  />
                  <Link
                    className="card__info"
                    to={`/artist/${track.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="card__artist">{track.artist}</span>
                    <span className="card__track">{track.name}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BrowseArtist;
