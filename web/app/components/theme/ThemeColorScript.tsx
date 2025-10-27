// ThemeColorScript.tsx
export default function ThemeColorScript({ nonce }: { nonce?: string }) {
  const js = `
  (function () {
    try {
      var stored = localStorage.getItem('theme'); // 'light' | 'dark' | 'system' | null
      var mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      var prefersDark = !!(mql && mql.matches);
      // Si no hay valor guardado, usa el sistema por defecto.
      var theme = stored || 'system';
      var finalTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

      var root = document.documentElement;
      // Cambia clase solo si es necesario
      var isDark = root.classList.contains('dark');
      if ((finalTheme === 'dark') !== isDark) {
        root.classList.toggle('dark', finalTheme === 'dark');
      }

      // Pista para UA/controles nativos
      try { root.style.colorScheme = finalTheme === 'dark' ? 'dark' : 'light'; } catch(e){}

      // Si el usuario elige "system", escucha cambios del SO
      if (theme === 'system' && mql && mql.addEventListener) {
        mql.addEventListener('change', function () {
          var nowDark = mql.matches;
          var shouldDark = nowDark;
          var hasDark = root.classList.contains('dark');
          if (shouldDark !== hasDark) {
            root.classList.toggle('dark', shouldDark);
            try { root.style.colorScheme = shouldDark ? 'dark' : 'light'; } catch(e){}
          }
        });
      }
    } catch (e) {}
  })();`;
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: js }} />;
}
