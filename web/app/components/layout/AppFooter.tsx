export default function AppFooter() {
  return (
    <footer className="surface border-t bg-white">
      <div className="max-w-6xl mx-auto px-3 py-3">
        <p className="text-center text-xs text-slate-500">
          Powered by <span className="font-semibold text-slate-700">Ludycom</span>
          <br />
          <span className="text-xs text-slate-400">© {new Date().getFullYear()} All rights reserved</span>
        </p>
      </div>
    </footer>
  );
}
