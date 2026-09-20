export function TrioneLogo({
  size = 40,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center rounded-full border-2 font-extrabold tracking-tight ${
        light ? "border-white text-white" : "border-trione text-trione bg-white"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.18 }}
    >
      <span className="leading-none text-center px-1">
        TRIONE
        <br />
        .VN
      </span>
    </div>
  );
}
