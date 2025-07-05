import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

import { ChakraProvider } from "@chakra-ui/react";

import App from "./App";
import UserProvider from "./context/UserProvider.jsx";
import theme from "./theme";

const root = createRoot(document.getElementById("root"));
root.render(
  <ChakraProvider theme={theme}>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </ChakraProvider>
);
