export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Você está offline</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Não foi possível conectar ao Presença Pro. Verifique sua internet e tente novamente.
      </p>
    </div>
  );
}
