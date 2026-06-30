import React from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse/Browse";
import ArtistProfile from "./pages/ArtistProfile/ArtistProfile";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/Authentication/ArtistSubmissionForm.js/SignUp";
import Login from "./pages/Authentication/Login";
import "./App.scss";

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/artist/:idFromParams" element={<ArtistProfile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
