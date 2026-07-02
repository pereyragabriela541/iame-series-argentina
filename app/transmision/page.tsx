import PageHeader from "@/components/PageHeader";

const YOUTUBE_IAME_SERIES =
  "https://www.youtube.com/results?search_query=iame+series";

export const metadata = { title: "Transmisión | IAME Series Argentina" };

export default function TransmisionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Streaming"
        title="Transmisión en Vivo"
        subtitle="Seguí la transmisión oficial en YouTube"
      />

      <div className="border border-iame-sky/40 bg-iame-sky/10 px-6 py-10 text-center">
        <a
          href={YOUTUBE_IAME_SERIES}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-iame-red px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
        >
          Ver transmisión en YouTube ↗
        </a>
      </div>
    </div>
  );
}
