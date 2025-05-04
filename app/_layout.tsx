// app/_layout.js o .tsx
import { Slot } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
  
      <Slot />
  );
}
