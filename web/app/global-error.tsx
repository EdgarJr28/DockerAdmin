"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset?: () => void;
}) {
    return (
        <html lang="es">
            <body
                style={{
                    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
                    background: "#0f172a",
                    color: "white",
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    padding: "1.5rem",
                }}
            >
                <div style={{ textAlign: "center", maxWidth: 420 }}>
                    <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                        Algo salió mal
                    </h1>
                    <p style={{ opacity: 0.7, marginBottom: "1rem" }}>
                        Ocurrió un error mientras generábamos la página.
                    </p>
                    {error?.digest ? (
                        <p
                            style={{
                                background: "rgba(15,23,42,.35)",
                                borderRadius: "9999px",
                                fontSize: "0.7rem",
                                display: "inline-block",
                                padding: ".35rem .75rem",
                            }}
                        >
                            id: {error.digest}
                        </p>
                    ) : null}
                    {reset ? (
                        <div style={{ marginTop: "1rem" }}>
                            <button
                                onClick={() => reset()}
                                style={{
                                    background: "white",
                                    color: "#0f172a",
                                    border: "none",
                                    borderRadius: "9999px",
                                    padding: ".35rem 1.2rem",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                }}
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : null}
                </div>
            </body>
        </html>
    );
}
