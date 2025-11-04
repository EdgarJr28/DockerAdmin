export default function NotFound() {
  return (
    <html lang="es">
      <head>
        <title>Página no encontrada</title>
      </head>
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#0f172a",
          color: "white",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            404 — No encontrada
          </h1>
          <p style={{ opacity: 0.75 }}>
            La página que intentas acceder no existe o fue movida.
          </p>
        </div>
      </body>
    </html>
  );
}
