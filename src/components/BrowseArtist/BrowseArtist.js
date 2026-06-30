import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import "./BrowseArtist.scss";

const ITUNES_URL =
  "https://itunes.apple.com/search?term=hip-hop+rnb+afrobeats&media=music&entity=song&limit=24";

function BrowseArtist() {
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const audioRef = useRef(null);

  useEffect(() => {
    axios.get(ITUNES_URL).then((response) => {
      const validTracks = response.data.results
        .filter((result) => result.previewUrl)
        .map((result) => ({
          name: result.trackName,
          artist: result.artistName,
          image: result.artworkUrl100.replace("100x100", "300x300"),
          preview: result.previewUrl,
          id: result.artistId,
        }));
      setTracks(validTracks);
    });
  }, []);

  useEffect(() => {
    if (!audioRef.current || tracks.length === 0) return;

    audioRef.current.src = tracks[currentIndex].preview;

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [tracks, currentIndex, isPlaying]);

  function handleSongEnd() {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % tracks.length);
  }

  function handleCardClick(index) {
    if (currentIndex === index) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentIndex(index);
      setIsPlaying(true);
    }
  }

  return (
    <div className="browse-artist">
      <audio ref={audioRef} onEnded={handleSongEnd} preload="auto" />
      <div className="cards">
        {tracks.map((track, index) => (
          <div
            className="card"
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
            onClick={() => handleCardClick(index)}
          >
            {hoveredIndex === index && (
              <div className="player">
                <button onClick={() => setIsPlaying((prev) => !prev)}>
                  {isPlaying && currentIndex === index ? "Pause" : "Play"}
                </button>
              </div>
            )}
            <img src={track.image} alt={`${track.artist} — ${track.name}`} />
            <Link className="next-video" to={`/artist/${track.id}`}>
              <Typography>{track.artist}</Typography>
              <Typography>{track.name}</Typography>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrowseArtist;
