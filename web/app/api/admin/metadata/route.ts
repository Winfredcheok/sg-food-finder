import { NextRequest, NextResponse } from "next/server";

// Fetches standard page metadata (Open Graph tags + publish date) from a
// review URL. This is the same sanctioned metadata social previews use —
// not article scraping. Used by the /admin form to pre-fill fields.
export async function GET(request: NextRequest) {
  // Local-only: also reject anything arriving through a tunnel/proxy
  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("cf-connecting-ip");
  if (process.env.VERCEL || forwarded) {
    return NextResponse.json({ error: "Admin tools are local-only" }, { status: 403 });
  }
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SGFoodFinder-admin)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Page returned ${res.status}` }, { status: 502 });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not reach that URL" }, { status: 502 });
  }

  const meta = (property: string): string | null => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    );
    const m = html.match(re);
    return m ? (m[1] ?? m[2]) : null;
  };

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null;
  const published = meta("article:published_time");

  return NextResponse.json({
    title: meta("og:title") ?? titleTag,
    description: meta("og:description"),
    siteName: meta("og:site_name"),
    datePublished: published ? published.slice(0, 10) : null,
  });
}
