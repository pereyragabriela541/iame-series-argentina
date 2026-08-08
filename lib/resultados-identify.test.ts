import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  identifyFromFileName,
  identifyResultPdf,
  type CategoryRef,
} from "../lib/resultados-identify";
import { extractPdfContent } from "../lib/resultados-pdf";
import {
  RESULT_SESSION_LABELS,
  getResultSessionOrder,
} from "../lib/round-results-order";

const categories: CategoryRef[] = [
  { id: "1", name: "60 MINI", slug: "60-mini", sort_order: 1 },
  { id: "2", name: "60 MINI UNDER", slug: "60-mini-under", sort_order: 2 },
  { id: "3", name: "JUNIOR MY10", slug: "junior", sort_order: 3 },
  { id: "4", name: "SENIOR MY10", slug: "senior", sort_order: 4 },
  { id: "5", name: "MASTER MY10", slug: "master", sort_order: 5 },
  { id: "6", name: "GENTLEMAN", slug: "master-gentleman", sort_order: 6 },
  { id: "7", name: "OKN JUNIOR", slug: "okn-junior", sort_order: 7 },
  { id: "8", name: "OKN", slug: "okn", sort_order: 8 },
  { id: "9", name: "SENIOR 390", slug: "senior-pro-390-honda", sort_order: 9 },
  { id: "10", name: "ACADEMY/HONDA", slug: "academy", sort_order: 10 },
];

const EXPECTED: Record<string, { slug: string; label: string }> = {
  "ACADEMY - CLASIFICACION.pdf": { slug: "academy", label: "Clasificación" },
  "CARRERA SPRINT - MINI.pdf": { slug: "60-mini", label: "Sprint" },
  "MINI - CLASIFICACION INVITADOS.pdf": {
    slug: "60-mini",
    label: "Clasificación Invitados",
  },
  "MINI - CLASIFICACION TITULARES.pdf": {
    slug: "60-mini",
    label: "Clasificación Titulares",
  },
  "MINI - SPRINT INVITADOS.pdf": { slug: "60-mini", label: "Sprint Invitados" },
  "OKN - CLASIFICACION TITULARES.pdf": {
    slug: "okn",
    label: "Clasificación Titulares",
  },
  "OKN - SPRINT INVITADOS.pdf": { slug: "okn", label: "Sprint Invitados" },
  "OKN - SPRINT TITULARES.pdf": { slug: "okn", label: "Sprint Titulares" },
  "OKN JUNIOR - CLASIFICACION INVITADOS.pdf": {
    slug: "okn-junior",
    label: "Clasificación Invitados",
  },
  "OKN JUNIOR - CLASIFICACION TITULARES.pdf": {
    slug: "okn-junior",
    label: "Clasificación Titulares",
  },
  "OKN JUNIOR - SPRINT INVITADOS.pdf": {
    slug: "okn-junior",
    label: "Sprint Invitados",
  },
  "OKN JUNIOR - SPRINT TITULARES.pdf": {
    slug: "okn-junior",
    label: "Sprint Titulares",
  },
  "OLD JUNIOR CLASIFICACION INVITADOS.pdf": {
    slug: "junior",
    label: "Clasificación Invitados",
  },
  "OLD JUNIOR CLASIFICACION TITULARES.pdf": {
    slug: "junior",
    label: "Clasificación Titulares",
  },
  "OLD JUNIOR SPRINT INVITADOS.pdf": {
    slug: "junior",
    label: "Sprint Invitados",
  },
  "OLD MASTER-GENTLEMAN CLASIFICACION INVITADOS.pdf": {
    slug: "master",
    label: "Clasificación Invitados",
  },
  "OLD MASTER-GENTLEMAN CLASIFICACION TITULARES.pdf": {
    slug: "master",
    label: "Clasificación Titulares",
  },
  "OLD MASTER-GENTLEMAN SPINT TITULARES.pdf": {
    slug: "master",
    label: "Sprint Titulares",
  },
  "OLD MASTER-GENTLEMAN SPRINT INVITADOS.pdf": {
    slug: "master",
    label: "Sprint Invitados",
  },
  "OLD SENIOR - CLASIFICACION INVITADOS.pdf": {
    slug: "senior",
    label: "Clasificación Invitados",
  },
  "OLD SENIOR - CLASIFICACION TITULARES.pdf": {
    slug: "senior",
    label: "Clasificación Titulares",
  },
  "OLD SENIOR - SPRINT INVITADOS.pdf": {
    slug: "senior",
    label: "Sprint Invitados",
  },
  "OLD SENIOR - SPRINT TITULARES.pdf": {
    slug: "senior",
    label: "Sprint Titulares",
  },
  "SPRINT OLD JUNIOR.pdf": { slug: "junior", label: "Sprint" },
};

describe("resultados identify from file name", () => {
  for (const [fileName, expected] of Object.entries(EXPECTED)) {
    it(fileName, () => {
      const match = identifyFromFileName(fileName, categories);
      assert.equal(match.status, "ready");
      assert.equal(match.categorySlug, expected.slug);
      assert.equal(match.label, expected.label);
    });
  }

  it("does not invent unknown categories", () => {
    const match = identifyFromFileName("FOOBAR - SPRINT TITULARES.pdf", categories);
    assert.equal(match.status, "needs_review");
    assert.equal(match.categoryId, null);
  });

  it("flags duplicates", () => {
    const match = identifyFromFileName("OKN - SPRINT TITULARES.pdf", categories, [
      { id: "dup-1", category_id: "8", label: "Sprint Titulares" },
    ]);
    assert.equal(match.status, "ready");
    assert.equal(match.duplicateResultId, "dup-1");
  });
});

describe("session order", () => {
  it("orders titulares/invitados after base session", () => {
    assert.ok(
      getResultSessionOrder("Clasificación Titulares") >
        getResultSessionOrder("Clasificación"),
    );
    assert.ok(
      getResultSessionOrder("Sprint Invitados") > getResultSessionOrder("Sprint"),
    );
    assert.ok(RESULT_SESSION_LABELS.includes("Sprint Titulares"));
  });
});

describe("pdf text headers", () => {
  it("detects explicit header in extractable text", () => {
    const match = identifyResultPdf(
      {
        fileName: "random.pdf",
        text: "MINI / MINI - SPRINT TITULARES\nPos 1 ...",
        title: null,
      },
      categories,
    );
    assert.equal(match.status, "ready");
    assert.equal(match.categorySlug, "60-mini");
    assert.equal(match.label, "Sprint Titulares");
    assert.equal(match.source, "pdf_text");
  });
});

const samplesDir =
  "/Users/gabrielaceciliapereyra/Downloads/resultados fecha 6  iame ";
const hasSamplePdfs = existsSync(samplesDir);

describe("real sample PDFs", { skip: !hasSamplePdfs }, () => {
  const files = readdirSync(samplesDir).filter((name) => name.endsWith(".pdf"));

  it("extracts text and identifies all samples", async () => {
    for (const fileName of files) {
      const buffer = readFileSync(path.join(samplesDir, fileName));
      const extracted = await extractPdfContent(buffer);
      assert.ok(extracted.text.length > 0, fileName);
      const match = identifyResultPdf(
        {
          fileName,
          text: extracted.text,
          title: extracted.title,
        },
        categories,
      );
      const expected = EXPECTED[fileName];
      assert.ok(expected, fileName);
      assert.equal(match.status, "ready", `${fileName}: ${match.reason}`);
      assert.equal(match.categorySlug, expected.slug, fileName);
      assert.equal(match.label, expected.label, fileName);
    }
  });
});
