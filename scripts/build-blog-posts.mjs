import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const posts = [
  {
    markdown: path.join(repoRoot, "blog/posts/cheating-agents.md"),
    metadata: path.join(repoRoot, "blog/posts/cheating-agents.meta.json"),
    output: path.join(repoRoot, "blog/cheating-agents.html")
  },
  {
    markdown: path.join(repoRoot, "blog/posts/openconjecture.md"),
    metadata: path.join(repoRoot, "blog/posts/openconjecture.meta.json"),
    output: path.join(repoRoot, "blog/openconjecture.html")
  }
];

const builtPosts = await Promise.all(posts.map(buildPost));
await syncBlogIndex(builtPosts);

async function buildPost(post) {
  const [markdown, metadataJson] = await Promise.all([
    fs.readFile(post.markdown, "utf8"),
    fs.readFile(post.metadata, "utf8")
  ]);

  const metadata = JSON.parse(metadataJson);
  const rendered = renderMarkdown(markdown, metadata);
  const html = renderPage(metadata, rendered);
  await fs.writeFile(post.output, html);
  console.log(`Built ${path.relative(repoRoot, post.output)}`);
  return metadata;
}

async function syncBlogIndex(postsMetadata) {
  const indexPath = path.join(repoRoot, "blog/index.html");
  let indexHtml = await fs.readFile(indexPath, "utf8");
  const indexUpdates = postsMetadata.map(({ slug, date }) => {
    const escapedDate = date.replace(/\$/g, "\\$");
    const replacementRegex = new RegExp(
      `(<div\\s+class=\\"home-blog-meta\\s+mono-font\\"\\s+[^>]*?data-post-slug=\\"${slug}\\"[^>]*>Essay ·\\s*)[^<]*<\\/div>`
    );
    return {
      from: replacementRegex,
      to: `$1${escapedDate}</div>`
    };
  });

  const nextHtml = indexUpdates.reduce(
    (updated, { from, to }) => updated.replace(from, to),
    indexHtml
  );

  if (nextHtml !== indexHtml) {
    await fs.writeFile(indexPath, nextHtml);
    console.log(`Synced blog index metadata in ${path.relative(repoRoot, indexPath)}`);
  }
}

function renderPage(metadata, rendered) {
  const citation = metadata.citation || {};
  const citationBibtex = `@misc{${citation.key || "citation"},\n    title = {${metadata.title.replace(
    /ArXiv/g,
    "{ArXiv}"
  )}},\n    author = {${metadata.contributors.map((person) => person.name).join(" and ")}},\n    howpublished = {\\url{${citation.url || ""}}},\n    year = {${citation.year || ""}},\n    month = {${citation.month || ""}},\n}`;

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(shortTitle(metadata.title))} | Davis Brown</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&amp;family=Lora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/main.css">
    <link rel="stylesheet" href="../css/components.css">
    <link rel="stylesheet" href="../css/papers.css">
    <link rel="stylesheet" href="../css/writing.css">
    <link rel="stylesheet" href="../css/responsive.css">
  </head>
  <body class="w3-content writing-page" style="max-width:2500px">
    <div class="w3-container main-content main-content--writing blog-shell">
      <div class="writing-post-layout">
        <aside class="writing-post-sidebar">
          <div class="writing-breadcrumb mono-font">
            <a href="../index.html">Home</a> / <a href="index.html">Blog</a>
          </div>
          <section class="writing-post-sidebar-section writing-post-toc">
            <div class="writing-post-toc-title mono-font">On this page</div>
            <nav class="writing-post-toc-links">
              ${rendered.toc
                .map(
                  (section) =>
                    `<a href="#${escapeAttribute(section.id)}">${escapeHtml(section.title)}</a>`
                )
                .join("\n              ")}
            </nav>
          </section>
        </aside>

        <div class="writing-post-main">
          <div class="writing-post-intro">
            <header class="writing-post-header">
              <div class="writing-post-type mono-font">${escapeHtml(metadata.type)}</div>
              <h1 class="writing-post-title">${escapeHtml(metadata.title)}</h1>
              <p class="writing-post-dek mono-font">
                ${escapeHtml(metadata.dek)}
              </p>
            </header>

            ${
              metadata.showTopbar === false
                ? '<div class="writing-post-topbar writing-post-topbar--empty"></div>'
                : `<div class="writing-post-topbar">
            <div class="writing-post-meta-grid">
              <section class="writing-post-meta-panel">
                <div class="writing-post-sidebar-label mono-font">Contributors</div>
                <div class="writing-post-sidebar-value">${renderContributors(metadata.contributors)}</div>
              </section>

              <section class="writing-post-meta-panel">
                <div class="writing-post-sidebar-label mono-font">Date</div>
                <div class="writing-post-sidebar-value">${escapeHtml(metadata.date)}</div>
              </section>

              <section class="writing-post-meta-panel">
                <div class="writing-post-sidebar-label mono-font">Share</div>
                <div class="writing-post-sidebar-links mono-font">
                  ${metadata.shareLinks
                    .map(
                      (link) =>
                        `<a href="${escapeAttribute(
                          link.url
                        )}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
                    )
                    .join("\n                  ")}
                  <button type="button" class="writing-post-copy-link mono-font" id="citation-button">Citation</button>
                </div>
              </section>
            </div>
          </div>`
            }
          </div>

          <article class="writing-post-body">
            ${rendered.html}
            ${renderReferences(metadata.references || [])}
          </article>
        </div>
      </div>
    </div>
    <div class="writing-modal" id="citation-modal" aria-hidden="true">
      <div class="writing-modal-backdrop" data-close-modal></div>
      <div class="writing-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="citation-modal-title">
        <div class="writing-modal-header">
          <h2 class="writing-modal-title" id="citation-modal-title">BibTeX Citation</h2>
          <button type="button" class="writing-modal-close mono-font" id="citation-close-button" aria-label="Close citation dialog">×</button>
        </div>
        <pre class="writing-modal-code" id="citation-bibtex">${escapeHtml(citationBibtex)}</pre>
        <button type="button" class="writing-modal-copy mono-font" id="citation-copy-button">Copy BibTeX</button>
      </div>
    </div>
    <script>
      (function () {
        var modal = document.getElementById("citation-modal");
        var openButton = document.getElementById("citation-button");
        var closeButton = document.getElementById("citation-close-button");
        var copyButton = document.getElementById("citation-copy-button");
        var bibtex = document.getElementById("citation-bibtex");
        if (!modal || !openButton || !closeButton || !copyButton || !bibtex) return;

        function openModal() {
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
        }

        function closeModal() {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
        }

        openButton.addEventListener("click", openModal);
        closeButton.addEventListener("click", closeModal);

        modal.addEventListener("click", function (event) {
          if (event.target && event.target.hasAttribute("data-close-modal")) {
            closeModal();
          }
        });

        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape" && modal.classList.contains("is-open")) {
            closeModal();
          }
        });

        copyButton.addEventListener("click", function () {
          if (!navigator.clipboard) return;
          navigator.clipboard.writeText(bibtex.textContent).then(function () {
            var original = copyButton.textContent;
            copyButton.textContent = "Copied";
            window.setTimeout(function () {
              copyButton.textContent = original;
            }, 1200);
          });
        });

        var tocLinks = Array.prototype.slice.call(
          document.querySelectorAll(".writing-post-toc-links a")
        );
        var tocTargets = tocLinks
          .map(function (link) {
            var id = (link.getAttribute("href") || "").replace("#", "");
            var target = id ? document.getElementById(id) : null;
            return target ? { link: link, target: target } : null;
          })
          .filter(Boolean);

        function setActiveToc(id) {
          tocLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        }

        function updateActiveToc() {
          if (!tocTargets.length) return;
          var activeId = tocTargets[0].target.id;
          var threshold = window.innerHeight * 0.9;

          tocTargets.forEach(function (entry) {
            if (entry.target.getBoundingClientRect().top <= threshold) {
              activeId = entry.target.id;
            }
          });

          setActiveToc(activeId);
        }

        updateActiveToc();
        window.addEventListener("scroll", updateActiveToc, { passive: true });
        window.addEventListener("resize", updateActiveToc);
      }());
    </script>
  </body>
</html>
`;
}

function renderMarkdown(markdown, metadata) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const references = {};
  const footnoteDefinitions = {};
  const contentLines = [];

  lines.forEach((line) => {
    const footnoteMatch = line.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
    if (footnoteMatch) {
      footnoteDefinitions[footnoteMatch[1]] = footnoteMatch[2].trim();
      return;
    }

    const referenceMatch = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
    if (referenceMatch) {
      references[referenceMatch[1]] = referenceMatch[2].trim();
      return;
    }

    contentLines.push(line);
  });

  const blocks = [];
  let buffer = [];

  contentLines.forEach((line) => {
    if (!line.trim()) {
      if (buffer.length) {
        blocks.push(buffer.join("\n"));
        buffer = [];
      }
      return;
    }
    buffer.push(line);
  });

  if (buffer.length) {
    blocks.push(buffer.join("\n"));
  }

  const footnoteOrder = [];
  const footnoteLookup = {};
  const sections = [];
  const htmlParts = [];

  blocks.forEach((block) => {
    if (block.startsWith("# ")) {
      return;
    }

    if (block.startsWith("## ") && !block.startsWith("### ")) {
      const heading = block.replace(/^##\s+/, "").trim();
      const id = slugify(heading);
      sections.push({ id, title: heading });
      htmlParts.push(`<h2 id="${escapeAttribute(id)}">${escapeHtml(heading)}</h2>`);
      return;
    }

    if (block.startsWith("### ")) {
      const heading = block.replace(/^###\s+/, "").trim();
      const id = slugify(heading);
      htmlParts.push(`<h3 id="${escapeAttribute(id)}">${renderInline(heading, footnoteDefinitions, footnoteOrder, footnoteLookup)}</h3>`);
      return;
    }

    const imageMatch = block.match(/^!\[[^\]]*\]\[([^\]]+)\]$/);
    if (imageMatch) {
      const figureKey = imageMatch[1];
      const source = references[figureKey];
      const caption = imageCaptionFor(figureKey);
      const figureClass = figureKey === "image1" ? ' class="writing-figure-narrow"' : "";

      if (source) {
        htmlParts.push(
          `<figure${figureClass}><img src="${escapeAttribute(normalizeAssetPath(source))}" alt="${escapeAttribute(
            altTextFor(figureKey)
          )}"><figcaption>${escapeHtml(caption)}</figcaption></figure>`
        );
      }
      return;
    }

    const paragraphText = block.replace(/\n+/g, " ").trim();
    if (!paragraphText) {
      return;
    }

    htmlParts.push(
      `<p>${renderInline(paragraphText, footnoteDefinitions, footnoteOrder, footnoteLookup)}</p>`
    );
  });

  if (footnoteOrder.length) {
    htmlParts.push(renderNotes(footnoteOrder, footnoteLookup, footnoteDefinitions));
  }

  const toc = sections.slice();
  if (footnoteOrder.length) {
    toc.push({ id: "notes", title: "Notes" });
  }
  if ((metadata.references || []).length) {
    toc.push({ id: "references", title: "References" });
  }

  return {
    html: htmlParts.join("\n            "),
    toc
  };
}

function renderInline(text, footnoteDefinitions, footnoteOrder, footnoteLookup) {
  let html = escapeHtml(text);

  html = html.replace(/\[\^([^\]]+)\]/g, function (_, key) {
    if (!footnoteLookup[key]) {
      footnoteOrder.push(key);
      footnoteLookup[key] = footnoteOrder.length;
    }

    const index = footnoteLookup[key];
    return `<sup class="writing-footnote-call"><a href="#note-${index}" id="note-ref-${index}">${index}</a></sup>`;
  });

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}

function renderNotes(footnoteOrder, footnoteLookup, footnoteDefinitions) {
  const items = footnoteOrder
    .map((key) => {
      const index = footnoteLookup[key];
      const content = renderInline(
        footnoteDefinitions[key],
        footnoteDefinitions,
        footnoteOrder,
        footnoteLookup
      );
      return `<li id="note-${index}">${content} <a class="writing-note-backlink mono-font" href="#note-ref-${index}" aria-label="Jump back to note reference">↩</a></li>`;
    })
    .join("");

  return `<section class="writing-post-notes" id="notes"><h2>Notes</h2><ol>${items}</ol></section>`;
}

function renderReferences(references) {
  if (!references.length) {
    return "";
  }

  const items = references
    .map(
      (reference) =>
        `<li><a href="${escapeAttribute(reference.url)}" target="_blank" rel="noreferrer">${escapeHtml(
          reference.label
        )}</a></li>`
    )
    .join("");

  return `<section class="writing-post-references" id="references"><h2>References</h2><ul>${items}</ul></section>`;
}

function renderContributors(contributors) {
  const links = contributors.map(
    (person) => {
      const star = person.equal ? "*" : "";
      return `<a href="${escapeAttribute(person.url)}"${
        person.url.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""
      }>${escapeHtml(person.name)}${star}</a>`;
    }
  );
  const hasEqual = contributors.some((p) => p.equal);
  let joined;
  if (links.length <= 2) {
    joined = links.join(" and ");
  } else {
    joined = links.slice(0, -1).join(", ") + ", and " + links[links.length - 1];
  }
  if (hasEqual) {
    joined += '<br><span style="font-size:0.85em;font-style:italic;">*Equal contribution. Order decided by coin flip</span>';
  }
  return joined;
}

function shortTitle(title) {
  return title.split("|")[0].replace(/\s+from the ArXiv$/, "").trim();
}

function imageCaptionFor(key) {
  if (key === "image1") {
    return "Distribution of extracted conjectures across mathematical subfields.";
  }
  if (key === "image2") {
    return "Interestingness and tractability score distributions for extracted conjectures.";
  }
  const cheatingCaptions = {
    overview: "Over 1,000 validated cheating instances found across 28 benchmark submissions.",
    pilot: "Pilot agent reads from an inaccessible /tests directory to extract expected outputs.",
    forge_mteb: "ForgeCode AGENTS.md contains the answer key; the agent copies it verbatim.",
    forge_bnfit: "ForgeCode agent hardcodes Bayesian Network edges from AGENTS.md.",
    hal_usaco: "HAL USACO scaffold injects full solution code disguised as a similar problem.",
    cybench: "Agent Googles a CyBench CTF challenge and extracts the flag from a public writeup.",
    swebench: "Agent mines git history to find and copy the fix commit.",
    metaharness: "Agent writes code that prints PASS to trick the verifier.",
    swesmith: "Agent hardcodes return values for exact test inputs.",
    bountybench: "Agents fake exploits using grep pattern matching and mock libraries."
  };
  if (cheatingCaptions[key]) return cheatingCaptions[key];
  return key.replace(/[-_]/g, " ");
}

function altTextFor(key) {
  if (key === "image1") {
    return "Histogram showing the number of extracted conjectures by mathematical subfield.";
  }
  if (key === "image2") {
    return "KDE plot showing interestingness and tractability score distributions for extracted conjectures across mathematical subfields.";
  }
  if (key === "overview") {
    return "Dot plot showing over 1,000 validated cheating instances across 28 benchmark submissions.";
  }
  return imageCaptionFor(key);
}

function normalizeAssetPath(source) {
  if (source.startsWith("/assets/")) {
    return `..${source}`;
  }
  return source;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
