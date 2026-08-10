import sqlite3
from datetime import datetime, timedelta, timezone

db = r"C:\Users\pedro\AppData\Roaming\com.corelearn.app\core_learn.db"
con = sqlite3.connect(db)
cur = con.cursor()

subjects = cur.execute("select count(*) from subjects").fetchone()[0]
blocks = cur.execute("select count(*) from blocks").fetchone()[0]
topics = cur.execute("select count(*) from topics").fetchone()[0]
print(f"counts subjects={subjects} blocks={blocks} topics={topics}")

row = cur.execute(
    "select id from topics where name like 'Membrana%' limit 1"
).fetchone()
assert row, "expected membrana topic"
tid = row[0]
now = datetime.now(timezone.utc)
nxt7 = (now + timedelta(days=7)).isoformat()
cur.execute(
    "update topics set completed=1, completed_at=?, next_review_at=?, review_stage=1 where id=?",
    (now.isoformat(), nxt7, tid),
)
cur.execute(
    "insert into study_log(topic_id,event,created_at) values (?,?,?)",
    (tid, "completed", now.isoformat()),
)

due_row = cur.execute(
    "select id from topics where completed=0 limit 1"
).fetchone()
assert due_row
due_id = due_row[0]
past = (now - timedelta(days=1)).isoformat()
cur.execute(
    "update topics set completed=1, completed_at=?, next_review_at=?, review_stage=1 where id=?",
    (past, past, due_id),
)
con.commit()

completed = cur.execute(
    "select count(*) from topics where completed=1"
).fetchone()[0]
due = cur.execute(
    "select count(*) from topics where completed=1 and next_review_at <= ?",
    (now.isoformat(),),
).fetchone()[0]
print(f"completed_topic={tid}")
print(f"due_topic={due_id}")
print(f"completed_total={completed}")
print(f"due_total={due}")
con.close()
print("smoke_ok")
