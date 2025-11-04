"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.4rem", marginBottom: ".5rem" }}>
          Error en la página
        </h1>
        <p style={{ opacity: 0.7, marginBottom: ".75rem" }}>
          {error?.message ?? "Ocurrió un error."}
        </p>
        {reset ? (
          <button
            onClick={() => reset()}
            style={{
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              padding: ".35rem 1.3rem",
              cursor: "pointer",
              fontSize: ".75rem",
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
