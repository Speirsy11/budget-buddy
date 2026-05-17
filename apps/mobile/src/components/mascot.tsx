/* eslint-disable @typescript-eslint/no-require-imports -- React Native bundles static assets via require() */
import { Image, type ImageStyle, type StyleProp } from "react-native";

// Single static require map — bundler will pick up every PNG at build time.
const sources = {
  // Mascot poses
  wave: require("../../assets/mascot/wave.png"),
  wave2: require("../../assets/mascot/wave2.png"),
  thumbsup: require("../../assets/mascot/thumbsup.png"),
  thumbs2: require("../../assets/mascot/thumbs2.png"),
  cheer: require("../../assets/mascot/cheer.png"),
  writing: require("../../assets/mascot/writing.png"),
  peaceful: require("../../assets/mascot/peaceful.png"),
  idle: require("../../assets/mascot/idle.png"),
  concerned: require("../../assets/mascot/concerned.png"),
  pointer: require("../../assets/mascot/pointer.png"),
  praying: require("../../assets/mascot/praying.png"),
  coinsman: require("../../assets/mascot/coinsman.png"),
  walletman: require("../../assets/mascot/walletman.png"),
  receiptman: require("../../assets/mascot/receiptman.png"),
  clipboardman: require("../../assets/mascot/clipboardman.png"),
  chartman: require("../../assets/mascot/chartman.png"),
  piggyman: require("../../assets/mascot/piggyman.png"),
  // Claymation icons
  coins: require("../../assets/mascot/coins.png"),
  coin: require("../../assets/mascot/coin.png"),
  wallet: require("../../assets/mascot/wallet.png"),
  receipt: require("../../assets/mascot/receipt.png"),
  clipboard: require("../../assets/mascot/clipboard.png"),
  shield: require("../../assets/mascot/shield.png"),
  csv: require("../../assets/mascot/csv.png"),
  bank: require("../../assets/mascot/bank.png"),
  pie: require("../../assets/mascot/pie.png"),
  bars: require("../../assets/mascot/bars.png"),
  piggy: require("../../assets/mascot/piggy.png"),
  star: require("../../assets/mascot/star.png"),
} as const;

export type MascotName = keyof typeof sources;

export interface MascotProps {
  name: MascotName;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Mascot({ name, size = 40, style }: MascotProps) {
  return (
    <Image
      // eslint-disable-next-line security/detect-object-injection -- name is from MascotName union
      source={sources[name]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
