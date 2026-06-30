import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography } from "@mui/material";
import axios from "axios";
import "./ArtistProfile.scss";

function ArtistProfile() {
  const { idFromParams } = useParams();
  const [tracks, setTracks] = useState([]);
  const [artistName, setArtistName] = useState("");
  const [artistImage, setArtistImage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(-1);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    axios
      .get(
        `https://itunes.apple.com/search?artistId=${idFromParams}&media=music&entity=song&limit=12`
      )
      .then((response) => {
        const results = response.data.results.filter((r) => r.previewUrl);
        if (results.length > 0) {
          setArtistName(results[0].artistName);
          setArtistImage(
            results[0].artworkUrl100.replace("100x100", "300x300")
          );
          setTracks(
            results.map((r) => ({
              name: r.trackName,
              artist: r.artistName,
              image: r.artworkUrl100.replace("100x100", "300x300"),
              preview: r.previewUrl,
              id: r.artistId,
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [idFromParams]);

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
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  }

  function handleCardClick(index) {
    if (currentIndex === index) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentIndex(index);
      setIsPlaying(true);
    }
  }

  if (loading)
    return <div className="artist-profile__loading">Loading artist...</div>;

  if (tracks.length === 0)
    return (
      <div className="artist-profile__loading">
        No tracks found for this artist.{" "}
        <Link to="/browse">Back to Browse</Link>
      </div>
    );

  return (
    <div className="artist-profile">
      {artistImage && (
        <img
          className="artist-profile__hero-img"
          src={artistImage}
          alt={artistName}
        />
      )}
      <Typography
        component="h1"
        sx={{
          fontWeight: "bold",
          color: "white",
          fontFamily: "Arial",
          mb: 1,
          fontSize: "2rem",
        }}
      >
        {artistName}
      </Typography>
      <Typography
        component="p"
        sx={{ color: "rgba(255,255,255,0.6)", fontFamily: "Arial", mb: 3 }}
      >
        {tracks.length} tracks available
      </Typography>

      <audio ref={audioRef} onEnded={handleSongEnd} preload="auto" />

      <div className="cards">
        {tracks.map((track, index) => (
          <div
            className="card"
            key={index}
            onMouseEnter={() => setIsHovering(index)}
            onMouseLeave={() => setIsHovering(-1)}
            onClick={() => handleCardClick(index)}
          >
            {isHovering === index && (
              <div className="player">
                <button onClick={() => handleCardClick(index)}>
                  {isPlaying && currentIndex === index ? "⏸" : "▶"}
                </button>
              </div>
            )}
            <img src={track.image} alt={`${track.artist} — ${track.name}`} />
            <div className="card__info">
              <p className="card__title">{track.name}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/browse" className="artist-profile__back">
        ← Back to Browse
      </Link>
    </div>
  );
}

export default ArtistProfile;
