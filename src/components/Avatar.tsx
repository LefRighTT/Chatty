interface Props {
  name: string | null;
  image: string | null;
  size?: number;
  glow?: boolean;
}

const PALETTE = ["#F5A94D", "#FF6F61", "#C97BAE", "#8FBF9F", "#E8C468", "#7BA7C9"];

function colorForName(name: string) {
  const index = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[index];
}

export default function Avatar({ name, image, size = 32, glow = false }: Props) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  const style = { width: size, height: size };

  // A chosen avatar color is stored as "avatar:#hexcode" in the image field
  const isColorTag = image?.startsWith("avatar:");
  const chosenColor = isColorTag ? image!.slice(7) : null;

  if (image && !isColorTag) {
    return (
      <img
        src={image}
        alt={name ?? ""}
        style={style}
        className={`flex-shrink-0 rounded-full object-cover ${
          glow ? "presence-glow" : ""
        }`}
      />
    );
  }

  return (
    <div
      style={{ ...style, background: chosenColor ?? colorForName(initial) }}
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-medium text-background ${
        glow ? "presence-glow" : ""
      }`}
    >
      <span style={{ fontSize: size * 0.42 }}>{initial}</span>
    </div>
  );
}

export { PALETTE };