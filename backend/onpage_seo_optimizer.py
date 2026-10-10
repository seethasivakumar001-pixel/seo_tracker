"""
On-Page SEO HTML & Metadata Optimizer using BeautifulSoup (bs4)

This script parses HTML, injects/updates <title> and <meta name="description"> tags,
applies custom link styling for all <a> tags, and formats the output.
"""

import sys
import os
import site
import re

# Ensure user site-packages are discovered by IDE and Python runtime
try:
    user_site = site.getusersitepackages()
    if os.path.exists(user_site) and user_site not in sys.path:
        sys.path.insert(0, user_site)
except Exception:
    pass

try:
    from bs4 import BeautifulSoup  # type: ignore
    BS4_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    BeautifulSoup = None  # type: ignore
    BS4_AVAILABLE = False


def optimize_html(
    html_content: str,
    title: str = "Enterprise SEO & Real-time SERP Tracker",
    description: str = "Monitor keyword rankings, backlink health, crawler metrics, and on-page SEO signals in real time.",
    link_style: str = "text-decoration: none; color: #2563eb; background-color: rgba(37, 99, 235, 0.12); padding: 0 4px; border-radius: 4px;",
    add_open_graph: bool = True
) -> str:
    """
    Optimizes HTML content with meta title, description, styled links, and Open Graph tags.
    Uses BeautifulSoup if available, or falls back to regex-based HTML optimization.
    """
    if BS4_AVAILABLE and BeautifulSoup:
        soup = BeautifulSoup(html_content, "html.parser")

        # 1. Ensure <head> exists
        head = soup.head
        if not head:
            head = soup.new_tag("head")
            if soup.html:
                soup.html.insert(0, head)
            else:
                soup.insert(0, head)

        # 2. Update or Create <title>
        title_tag = head.find("title")
        if title_tag:
            title_tag.string = title
        else:
            new_title = soup.new_tag("title")
            new_title.string = title
            head.append(new_title)

        # 3. Update or Create <meta name="description">
        desc_tag = head.find("meta", attrs={"name": lambda val: val and val.lower() == "description"})
        if desc_tag:
            desc_tag["content"] = description
        else:
            new_desc = soup.new_tag("meta", attrs={"name": "description", "content": description})
            head.append(new_desc)

        # 4. Apply custom link styling to all <a> tags
        if link_style:
            for a in soup.find_all("a", href=True):
                existing_style = a.get("style", "").strip()
                if existing_style:
                    a["style"] = f"{existing_style.rstrip(';')}; {link_style}"
                else:
                    a["style"] = link_style

        # 5. Add Open Graph metadata for rich social previews
        if add_open_graph:
            og_data = {
                "og:title": title,
                "og:description": description,
                "og:type": "website",
            }
            for prop, content in og_data.items():
                og_meta = head.find("meta", attrs={"property": prop})
                if og_meta:
                    og_meta["content"] = content
                else:
                    new_og = soup.new_tag("meta", attrs={"property": prop, "content": content})
                    head.append(new_og)

        return soup.prettify()

    # Fallback when BeautifulSoup is not installed:
    output = html_content

    # Title replacement / insertion
    if re.search(r"<title[^>]*>.*?</title>", output, flags=re.IGNORECASE | re.DOTALL):
        output = re.sub(r"<title[^>]*>.*?</title>", f"<title>{title}</title>", output, flags=re.IGNORECASE | re.DOTALL)
    elif re.search(r"<head[^>]*>", output, flags=re.IGNORECASE):
        output = re.sub(r"(<head[^>]*>)", f"\\1\n    <title>{title}</title>", output, count=1, flags=re.IGNORECASE)
    else:
        output = f"<head>\n    <title>{title}</title>\n</head>\n" + output

    # Meta description replacement / insertion
    if re.search(r'<meta[^>]*name=["\']description["\'][^>]*>', output, flags=re.IGNORECASE):
        output = re.sub(
            r'<meta[^>]*name=["\']description["\'][^>]*>',
            f'<meta name="description" content="{description}">',
            output,
            flags=re.IGNORECASE
        )
    elif re.search(r"</head>", output, flags=re.IGNORECASE):
        output = re.sub(
            r"(</head>)",
            f'    <meta name="description" content="{description}">\n\\1',
            output,
            count=1,
            flags=re.IGNORECASE
        )

    # Link style injection
    if link_style:
        def replace_link(match):
            tag = match.group(0)
            if 'style="' in tag or "style='" in tag:
                tag = re.sub(r'style=(["\'])(.*?)\1', f'style=\\1\\2; {link_style}\\1', tag)
            else:
                tag = re.sub(r'<a\s+', f'<a style="{link_style}" ', tag, count=1)
            return tag

        output = re.sub(r'<a\s+[^>]*href=[^>]*>', replace_link, output, flags=re.IGNORECASE)

    return output



if __name__ == "__main__":
    sample_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Old Untracked Page</title>
    </head>
    <body>
        <p>Read more on <a href="https://example.com">our guide</a> and check out <a href="https://my99exch.ai">my99exch.ai</a>.</p>
    </body>
    </html>
    """

    custom_link_style = (
        "text-decoration: none; "
        "color: #2563eb; "
        "background-color: rgba(37, 99, 235, 0.12); "
        "padding: 0 4px; "
        "border-radius: 4px;"
    )

    optimized = optimize_html(
        sample_html,
        title="TechSphere Enterprise Cloud Data Architecture & Streaming Platform",
        description="Build, transform, and sync sub-second data pipelines across multi-cloud environments. Scale your enterprise data platform with TechSphere.",
        link_style=custom_link_style
    )

    print("════════════ OPTIMIZED HTML OUTPUT ════════════")
    print(optimized)
