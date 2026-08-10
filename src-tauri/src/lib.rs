use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_core_learn_schema",
            sql: r#"
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL REFERENCES blocks(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  priority TEXT NOT NULL DEFAULT 'media',
  difficulty TEXT NOT NULL DEFAULT 'media',
  notes TEXT DEFAULT '',
  next_review_at TEXT,
  review_stage INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE study_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id TEXT REFERENCES topics(id),
  event TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_topics_block_id ON topics(block_id);
CREATE INDEX idx_blocks_subject_id ON blocks(subject_id);
CREATE INDEX idx_topics_next_review ON topics(next_review_at);
CREATE INDEX idx_study_log_created_at ON study_log(created_at);
"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed_core_learn_content",
            sql: include_str!("../seed.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_topic_didactic_content",
            sql: include_str!("../migration-v3.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:core_learn.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
