// === PHẦN: Palette theo ngữ cảnh màu nền ===
// Chọn màu foreground có contrast tốt hơn giữa mực sáng và mực tối.
export interface ContextualColorPalette {
  primary: string;
  secondary: string;
  muted: string;
  surface: string;
  track: string;
  border: string;
  controlSurface: string;
  controlText: string;
}

const DARK_FOREGROUND = "#1C1917";
const LIGHT_FOREGROUND = "#FAFAFA";

const parseHexColor = (value: string) => {
  const hex = value.trim().replace("#", "");
  const normalized = hex.length === 3
    ? hex.split("").map((channel) => `${channel}${channel}`).join("")
    : hex;

  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const getRelativeLuminance = (value: string) => {
  const rgb = parseHexColor(value);
  if (!rgb) return 0.95;

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const getContrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const brightest = Math.max(foregroundLuminance, backgroundLuminance);
  const darkest = Math.min(foregroundLuminance, backgroundLuminance);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const getContextualColorPalette = (
  background: string,
): ContextualColorPalette => {
  const useLightText =
    getContrastRatio(LIGHT_FOREGROUND, background) >
    getContrastRatio(DARK_FOREGROUND, background);

  return useLightText
    ? {
        primary: LIGHT_FOREGROUND,
        secondary: "rgba(250, 250, 250, 0.78)",
        muted: "rgba(250, 250, 250, 0.64)",
        surface: "rgba(24, 24, 27, 0.72)",
        track: "rgba(24, 24, 27, 0.38)",
        border: "rgba(250, 250, 250, 0.36)",
        controlSurface: LIGHT_FOREGROUND,
        controlText: DARK_FOREGROUND,
      }
    : {
        primary: DARK_FOREGROUND,
        secondary: "rgba(38, 38, 38, 0.78)",
        muted: "rgba(38, 38, 38, 0.62)",
        surface: "rgba(255, 255, 255, 0.88)",
        track: "rgba(255, 255, 255, 0.72)",
        border: "rgba(38, 38, 38, 0.28)",
        controlSurface: DARK_FOREGROUND,
        controlText: LIGHT_FOREGROUND,
      };
};
