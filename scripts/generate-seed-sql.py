import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
seed_path = ROOT / "src" / "db" / "seed.json"


def slugify(text: str) -> str:
    import unicodedata

    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


def esc(s: str) -> str:
    return s.replace("'", "''")


def topic_name(topic) -> str:
    if isinstance(topic, str):
        return topic
    return topic["name"]


def topic_content(topic) -> str:
    if isinstance(topic, str):
        return ""
    return topic.get("content") or ""


def main() -> None:
    data = json.loads(seed_path.read_text(encoding="utf-8"))
    lines: list[str] = []
    content_updates: list[str] = []

    for si, subject in enumerate(data["subjects"]):
        lines.append(
            "INSERT INTO subjects (id, name, tag, sort_order) VALUES "
            f"('{subject['id']}', '{esc(subject['name'])}', '{esc(subject['tag'])}', {si});"
        )
        for bi, block in enumerate(subject["blocks"]):
            block_id = f"{subject['id']}-{slugify(block['name'])}"
            lines.append(
                "INSERT INTO blocks (id, subject_id, name, sort_order) VALUES "
                f"('{block_id}', '{subject['id']}', '{esc(block['name'])}', {bi});"
            )
            for ti, topic in enumerate(block["topics"]):
                name = topic_name(topic)
                content = topic_content(topic)
                topic_id = f"{block_id}-{slugify(name)}"
                # v2 seed runs before content column exists — insert without content.
                lines.append(
                    "INSERT INTO topics (id, block_id, name, sort_order, completed, completed_at, "
                    "priority, difficulty, notes, next_review_at, review_stage) VALUES "
                    f"('{topic_id}', '{block_id}', '{esc(name)}', {ti}, 0, NULL, "
                    "'media', 'media', '', NULL, 0);"
                )
                if content.strip():
                    content_updates.append(
                        f"UPDATE topics SET content = '{esc(content)}' WHERE id = '{topic_id}';"
                    )

    out = ROOT / "src-tauri" / "seed.sql"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(lines)} statements to {out}")

    content_body = "\n".join(content_updates) + ("\n" if content_updates else "")
    content_out = ROOT / "src-tauri" / "seed-content.sql"
    content_out.write_text(content_body, encoding="utf-8")
    print(f"Wrote {len(content_updates)} content updates to {content_out}")

    migration_v3 = (
        "ALTER TABLE topics ADD COLUMN content TEXT NOT NULL DEFAULT '';\n"
        + content_body
    )
    migration_out = ROOT / "src-tauri" / "migration-v3.sql"
    migration_out.write_text(migration_v3, encoding="utf-8")
    print(f"Wrote migration v3 to {migration_out}")


if __name__ == "__main__":
    main()
