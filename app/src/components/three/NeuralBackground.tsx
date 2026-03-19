export default function NeuralBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#04050a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.14),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_72%_72%,rgba(34,197,94,0.1),transparent_34%)]" />
      <div className="absolute -top-28 -left-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" />
      <div className="absolute top-1/4 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl animate-pulse [animation-delay:900ms]" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl animate-pulse [animation-delay:1600ms]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(255,255,255,0.38)_1px,transparent_1px)] [background-size:3px_3px]" />
    </div>
  );
}
