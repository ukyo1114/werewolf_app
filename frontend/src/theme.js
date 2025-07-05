import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        margin: 0,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      },
    },
  },
  shadows: {
    uniform: "0 0 10px rgba(0, 0, 0, 0.5)",
  },
});

export default theme;
