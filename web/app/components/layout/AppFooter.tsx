export default function AppFooter() {
  return (
    <footer className="mt-auto w-full border-t bg-white/80 dark:bg-slate-950/40 backdrop-blur">
      <div className="max-w-6xl mx-auto px-3 py-3">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Powered by <span className="font-semibold text-slate-700 dark:text-slate-100">Ludycom</span>
          <br />
          <span className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} All rights reserved
          </span>
        </p>
      </div>
    </footer>
  );
}
