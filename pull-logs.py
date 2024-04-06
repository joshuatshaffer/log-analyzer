import requests
from journalparse import journalparse


r = requests.get(
    "https://logs.joshuatshaffer.com/entries",
    auth=("joshua", "[[Redacted]]"),
    headers={"Accept": "application/vnd.fdo.journal", "Range": "entries=:5"},
)

for entry in journalparse(r.iter_content()):
    print(entry)
