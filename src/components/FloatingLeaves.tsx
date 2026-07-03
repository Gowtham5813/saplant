const LEAVES = ["🌿", "🍃", "🌱", "🍀", "🌾"];

export const FloatingLeaves = ({ count = 14 }: { count?: number }) => {
  const items = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const dur = 14 + Math.random() * 18;
    const delay = -Math.random() * dur;
    const size = 16 + Math.random() * 22;
    const dx = (Math.random() - 0.5) * 200;
    const dr = (Math.random() - 0.5) * 360;
    const leaf = LEAVES[i % LEAVES.length];
    return (
      <span
        key={i}
        style={{
          left: `${left}%`,
          fontSize: `${size}px`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          ["--dx" as string]: `${dx}px`,
          ["--dr" as string]: `${dr}deg`,
        }}
      >
        {leaf}
      </span>
    );
  });
  return <div className="floating-leaves" aria-hidden="true">{items}</div>;
};
