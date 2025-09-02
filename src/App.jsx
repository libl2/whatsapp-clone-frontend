import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./pages/auth/auth.page";
import ChatsPage from "./pages/chats/chats.page";
import ErrorPage from "./pages/error/error.page";
import { socket } from './services/socket.service';
import { useAppContext } from "./context/appContext";


const App = () => {
  const [backendStatus, setBackendStatus] = useState(null);
  const {authenticate, loadingProgress, ready} = useAppContext();
  const loginUser = () => {
    localStorage.setItem("user", '{"loggedIn": true}');
  };
  const onConnect = (payload) => {
    console.log('onConnect', payload);
  };
  const onDisconnect = (payload) => {
    console.log('onDisconnect', payload);
  };
  const onReady = (payload) => {
    loginUser();
    ready(payload);
  };
  const onAuthenticated = (payload) => {
    loginUser();
    authenticate(payload);
  }
  const onLoading = (payload) => {
    loginUser();
    loadingProgress(payload);
  }

  useEffect(() => {
      fetch("/api/status")
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ready', onReady);
    socket.on('authenticated', onAuthenticated);
    socket.on('loading', onLoading);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ready', onReady);
      socket.off('authenticated', onAuthenticated);
      socket.off('loading', onLoading);
    };
  }, []);

  return (
    <>
    {/*/backendStatus && (
        <//div style={{position: "fixed", top: 0, left: 0, background: "#eee", padding: 8, zIndex: 9999}}>
          Backend status: {backendStatus}
        </div>
      )*/}
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
    </>
  );
};

export default App;
