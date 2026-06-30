import { Link } from "react-router-dom";
import { Typography } from "@mui/material";
import hero from "../assets/images/hero.jpg";
import bottom from "../assets/images/bottom.jpg";
import BrowseArtist from "../components/BrowseArtist/BrowseArtist";
import Upload from "../components/Upload/Upload";
import ArtistResource from "../components/ArtistResource/ArtistResource";
import "./Home.scss";

const Home = () => {
  return (
    <div className="home">
      <img className="home__img-top" src={hero} alt="DiscoverUs hero banner" />
      <div className="home__hero">
        <Typography variant="h4" sx={{ fontFamily: "Arial", color: "white", mb: 2 }}>
          Unleash Music&apos;s Hidden Gems with DiscoverUs
        </Typography>
      </div>
      <div className="home__artist">
        <Upload />
        <Link to="/signup">
          <button className="home__button">Sign Up Today</button>
        </Link>
        <Link to="/browse">
          <button className="home__button">Listen</button>
        </Link>
        <BrowseArtist />
      </div>
      <div className="home__closing">
        <Typography variant="h5" sx={{ fontFamily: "Arial", color: "white", mb: 1, margin: "10px" }}>
          Thanks for listening. Now Sign Up. Scout for emerging artists,
          collaborate and build your playlists. All for free.
        </Typography>
        <Link to="/browse">
          <button className="home__button">Scout</button>
        </Link>
      </div>
      <ArtistResource />
      <img className="home__img-bottom" src={bottom} alt="music producers" />
    </div>
  );
};

export default Home;
