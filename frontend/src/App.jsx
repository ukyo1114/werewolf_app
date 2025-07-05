import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import Home from "./pages/Home/Home.jsx";
import HowToPlay from "./pages/HowToPlay.jsx";
import Login from "./pages/Login/Login.jsx";
import RegisterUser from "./pages/RegisterUser/RegisterUser.jsx";
import RequestPasswordReconfig from "./pages/PasswordReconfigure/RequestPasswordReconfig.jsx";
import ReconfigPassword from "./pages/ReconfigPassword/ReconfigPassword.jsx";

const Channel = lazy(() => import("./pages/Channel/components/Channel.jsx"));
const SendRegistrationEmail = lazy(
  () => import("./pages/SendRegistrationEmail/SendRegistrationEmail.jsx")
);
const ChannelList = lazy(
  () => import("./pages/ChannelList/components/ChannelList.jsx")
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/channel" element={<Channel />} />
        <Route
          path="/reconfig-password/:token"
          element={<ReconfigPassword />}
        />
        <Route
          path="/send-registration-email"
          element={<SendRegistrationEmail />}
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/request-password-reconfig"
          element={<RequestPasswordReconfig />}
        />
        <Route path="/register/:token" element={<RegisterUser />} />
        <Route path="/channel-list" element={<ChannelList />} />
      </Routes>
    </Suspense>
  );
}

export default App;
