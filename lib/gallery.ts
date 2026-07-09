import type { MediaImage, MediaSection, MediaVideo, Round } from "@/lib/types";

export type GalleryBlock = {
  key: string;
  subtitle?: string;
  images: MediaImage[];
};

export type GallerySection = {
  key: string;
  title: string;
  subtitle?: string;
  description?: string[];
  roundNumber: number | null;
  eventDate: string | null;
  isUpcoming: boolean;
  blocks: GalleryBlock[];
  images: MediaImage[];
};

export type VideoSection = {
  key: string;
  title: string;
  subtitle?: string;
  description?: string[];
  roundNumber: number | null;
  eventDate: string | null;
  isUpcoming: boolean;
  videos: MediaVideo[];
};

export function splitDescription(description: string | null | undefined): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getDefaultRoundTitle(roundNumber: number): string {
  if (roundNumber === 11) return "FINAL";
  return `FECHA ${roundNumber}`;
}

export function getEmptySectionMessage(isUpcoming: boolean): string {
  return isUpcoming ? "Contenido próximamente." : "Sin contenido publicado.";
}

export function getMediaPageHeader(
  sections: MediaSection[],
  mediaType: "images" | "videos",
  fallback: { kicker: string; title: string; subtitle?: string },
): { kicker: string; title: string; subtitle?: string } {
  const page = sections.find(
    (s) => s.media_type === mediaType && s.round_id == null && s.section_key === "page",
  );
  return {
    kicker: page?.kicker?.trim() || fallback.kicker,
    title: page?.title?.trim() || fallback.title,
    subtitle: page?.subtitle?.trim() || fallback.subtitle,
  };
}

function sectionsForRound(
  all: MediaSection[],
  mediaType: "images" | "videos",
  roundId: string | null,
): MediaSection[] {
  return all
    .filter(
      (s) =>
        s.media_type === mediaType &&
        s.round_id === roundId &&
        s.section_key !== "page",
    )
    .sort((a, b) => a.sort_order - b.sort_order);
}

function roundEventDate(round: Round | null | undefined): string | null {
  return round?.event_date_iso ?? round?.event_date ?? null;
}

function isRoundUpcoming(round: Round | null | undefined): boolean {
  return round?.status === "upcoming" || round?.status === "live";
}

function sortSectionsChronologically<T extends { roundNumber: number | null; eventDate: string | null }>(
  sections: T[],
): T[] {
  return sections.sort((a, b) => {
    if (a.roundNumber == null) return 1;
    if (b.roundNumber == null) return -1;
    if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
    if (a.eventDate) return -1;
    if (b.eventDate) return 1;
    return (a.roundNumber ?? 0) - (b.roundNumber ?? 0);
  });
}

function roundSectionHeader(
  mediaSections: MediaSection[],
  mediaType: "images" | "videos",
  round: Round,
): { title: string; subtitle?: string; description: string[] } {
  const dbSections = sectionsForRound(mediaSections, mediaType, round.id);
  const header = dbSections.find((s) => s.title?.trim()) ?? dbSections[0];

  return {
    title: header?.title?.trim() || getDefaultRoundTitle(round.round_number),
    subtitle: header?.subtitle?.trim() || undefined,
    description: splitDescription(header?.description),
  };
}

function appendMissingImageSections(
  sections: GallerySection[],
  rounds: Round[],
  mediaSections: MediaSection[],
): GallerySection[] {
  const existingKeys = new Set(sections.map((section) => section.key));

  for (const round of rounds) {
    if (existingKeys.has(round.id)) continue;

    const header = roundSectionHeader(mediaSections, "images", round);
    sections.push({
      key: round.id,
      title: header.title,
      subtitle: header.subtitle,
      description: header.description,
      roundNumber: round.round_number,
      eventDate: roundEventDate(round),
      isUpcoming: isRoundUpcoming(round),
      blocks: [],
      images: [],
    });
  }

  return sortSectionsChronologically(sections);
}

function appendMissingVideoSections(
  sections: VideoSection[],
  rounds: Round[],
  mediaSections: MediaSection[],
): VideoSection[] {
  const existingKeys = new Set(sections.map((section) => section.key));

  for (const round of rounds) {
    if (existingKeys.has(round.id)) continue;

    const header = roundSectionHeader(mediaSections, "videos", round);
    sections.push({
      key: round.id,
      title: header.title,
      subtitle: header.subtitle,
      description: header.description,
      roundNumber: round.round_number,
      eventDate: roundEventDate(round),
      isUpcoming: isRoundUpcoming(round),
      videos: [],
    });
  }

  return sortSectionsChronologically(sections);
}

export function groupMediaImagesByRound(
  images: MediaImage[],
  rounds: Round[],
  mediaSections: MediaSection[] = [],
): GallerySection[] {
  const roundById = Object.fromEntries(rounds.map((round) => [round.id, round]));
  const byRound = new Map<string, MediaImage[]>();

  for (const image of images) {
    const round = image.round_id ? roundById[image.round_id] : null;
    const roundNumber = round?.round_number ?? image.rounds?.round_number ?? null;
    const key = round?.id ?? (roundNumber != null ? `fecha-${roundNumber}` : "sin-fecha");
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key)!.push(image);
  }

  const result: GallerySection[] = [];

  for (const [key, roundImages] of byRound) {
    roundImages.sort((a, b) => a.sort_order - b.sort_order);
    const first = roundImages[0];
    const round = first.round_id ? roundById[first.round_id] : null;
    const roundNumber = round?.round_number ?? first.rounds?.round_number ?? null;
    const roundId = round?.id ?? first.round_id ?? null;

    const dbSections = sectionsForRound(mediaSections, "images", roundId);
    const headerSection = dbSections.find((s) => s.title?.trim()) ?? dbSections[0];

    const title =
      headerSection?.title?.trim() ||
      (roundNumber != null ? getDefaultRoundTitle(roundNumber) : "Galería general");
    const subtitle = headerSection?.subtitle?.trim() || undefined;
    const description = splitDescription(headerSection?.description);

    let blocks: GalleryBlock[];

    if (dbSections.length) {
      blocks = [];
      for (const section of dbSections) {
        const blockImages = roundImages.filter(
          (img) => (img.section_key || "main") === section.section_key,
        );
        if (!blockImages.length) continue;
        const isHeaderBlock = section.id === headerSection?.id;
        blocks.push({
          key: section.section_key,
          subtitle: isHeaderBlock ? undefined : section.subtitle?.trim() || undefined,
          images: blockImages,
        });
      }

      const knownKeys = new Set(dbSections.map((s) => s.section_key));
      const orphan = roundImages.filter((img) => !knownKeys.has(img.section_key || "main"));
      if (orphan.length) {
        blocks.push({ key: "otros", images: orphan });
      }
    } else {
      blocks = [{ key: "main", images: roundImages }];
    }

    result.push({
      key,
      title,
      subtitle,
      description,
      roundNumber,
      eventDate: roundEventDate(round),
      isUpcoming: isRoundUpcoming(round),
      blocks,
      images: roundImages,
    });
  }

  return appendMissingImageSections(
    sortSectionsChronologically(result),
    rounds,
    mediaSections,
  );
}

export function groupMediaVideosByRound(
  videos: MediaVideo[],
  rounds: Round[],
  mediaSections: MediaSection[] = [],
): VideoSection[] {
  const roundById = Object.fromEntries(rounds.map((round) => [round.id, round]));
  const byRound = new Map<string, MediaVideo[]>();

  for (const video of videos) {
    const round = video.round_id ? roundById[video.round_id] : null;
    const key = round?.id ?? (video.round_id ?? "sin-fecha");
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key)!.push(video);
  }

  const hasRoundVideos = [...byRound.keys()].some((key) => key !== "sin-fecha");
  const orphanVideos = byRound.get("sin-fecha") ?? [];

  if (!hasRoundVideos && orphanVideos.length) {
    orphanVideos.sort((a, b) => a.sort_order - b.sort_order);
    const pageish = sectionsForRound(mediaSections, "videos", null);
    const header = pageish.find((s) => s.section_key === "main") ?? pageish[0];
    const flatSection: VideoSection = {
      key: "all",
      title: header?.title?.trim() || "Videos",
      subtitle: header?.subtitle?.trim() || undefined,
      description: splitDescription(header?.description),
      roundNumber: null,
      eventDate: null,
      isUpcoming: false,
      videos: orphanVideos,
    };

    return appendMissingVideoSections([flatSection], rounds, mediaSections);
  }

  const result: VideoSection[] = [];

  for (const [key, roundVideos] of byRound) {
    if (key === "sin-fecha") continue;

    roundVideos.sort((a, b) => a.sort_order - b.sort_order);
    const first = roundVideos[0];
    const round = first.round_id ? roundById[first.round_id] : null;
    const roundNumber = round?.round_number ?? null;
    const roundId = round?.id ?? first.round_id ?? null;
    const dbSections = sectionsForRound(mediaSections, "videos", roundId);
    const header = dbSections.find((s) => s.title?.trim()) ?? dbSections[0];

    result.push({
      key,
      title:
        header?.title?.trim() ||
        (roundNumber != null ? getDefaultRoundTitle(roundNumber) : "Videos"),
      subtitle: header?.subtitle?.trim() || undefined,
      description: splitDescription(header?.description),
      roundNumber,
      eventDate: roundEventDate(round),
      isUpcoming: isRoundUpcoming(round),
      videos: roundVideos,
    });
  }

  if (orphanVideos.length) {
    orphanVideos.sort((a, b) => a.sort_order - b.sort_order);
    result.push({
      key: "sin-fecha",
      title: "Videos",
      roundNumber: null,
      eventDate: null,
      isUpcoming: false,
      videos: orphanVideos,
    });
  }

  return appendMissingVideoSections(
    sortSectionsChronologically(result),
    rounds,
    mediaSections,
  );
}
