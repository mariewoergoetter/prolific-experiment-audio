import csv

CSV_FILE = "items_01.csv"
OUTPUT_FILE = "experiments/01_focus/js/stimuli.js"

GROUP_ID_RANGES = {
    "Subject":   list(map(str, range(1, 16))),
    "VP":        list(map(str, range(16, 31))),
    "Object":    list(map(str, range(31, 46))),
    "Adjective": list(map(str, range(46, 61))),
    "Adjunct":   list(map(str, range(61, 76))),
}


GROUP_INDEX = {
    group: {rid: (i + 1) for i, rid in enumerate(rids)}
    for group, rids in GROUP_ID_RANGES.items()
}

def variant_for_item(list_no: int, item_index_within_group: int) -> str:
    return "cleft" if (list_no + item_index_within_group) % 2 == 0 else "neutral"

def two_items_for_list(rids: list[str], list_no: int) -> list[str]:
    i1 = list_no - 1
    i2 = list_no % 15
    return [rids[i1], rids[i2]]

def js_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


rows = {}

with open(CSV_FILE, newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f, delimiter=";")
    for r in reader:
        rid = str(r["ID"]).strip()
        rows[rid] = {
            "Group": r["group"].strip(),
            "neutral": r["neutral_s"].strip(),
            "cleft": r["focus_s"].strip(),
            "C1": r["C1 (focus-supported)"].strip(),
            "C2": r["C2 (focus-contradicting)"].strip(),
        }

missing = []
for group, rids in GROUP_ID_RANGES.items():
    for rid in rids:
        if rid not in rows:
            missing.append((group, rid))

if missing:
    msg = "\n".join([f"- Missing ID {rid} for group {group}" for group, rid in missing])
    raise ValueError(
        "Your CSV is missing required IDs for the 15-list design:\n" + msg
    )


stims = []

for list_no in range(1, 16): 
    for group in ["Subject", "VP", "Object", "Adjective", "Adjunct"]:
        rids = GROUP_ID_RANGES[group]
        chosen_rids = two_items_for_list(rids, list_no) 

        for rid in chosen_rids:
            idx = GROUP_INDEX[group][rid]  
            variant = variant_for_item(list_no, idx)
            sentence = rows[rid]["neutral"] if variant == "neutral" else rows[rid]["cleft"]

            stims.append({
                "ItemID": rid,
                "Group": group,
                "Type": "critical",
                "List": list_no,
                "Variant": variant,
                "Sentence": sentence,
                "C1": rows[rid]["C1"],
                "C2": rows[rid]["C2"],
            })

fillers = [
  {"ItemID":"F01","Group":"Filler","Type":"filler",
   "Sentence":"The train arrived later than expected.",
   "C1":"There had been an accident on the tracks earlier.",
   "C2":"The train usually arrives on time."},

  {"ItemID":"F02","Group":"Filler","Type":"filler",
   "Sentence":"Lena bought a new laptop last week.",
   "C1":"Her old one had stopped working completely.",
   "C2":"She compared several models online beforehand."},

  {"ItemID":"F03","Group":"Filler","Type":"filler",
   "Sentence":"The meeting was moved to the afternoon.",
   "C1":"Several people were unavailable in the morning.",
   "C2":"The meeting was scheduled to last an hour."},

  {"ItemID":"F04","Group":"Filler","Type":"filler",
   "Sentence":"Tom cooked dinner for everyone.",
   "C1":"He enjoys trying out new recipes.",
   "C2":"He used ingredients he already had at home."},

  {"ItemID":"F05","Group":"Filler","Type":"filler",
   "Sentence":"The children stayed inside all day.",
   "C1":"It was raining heavily outside.",
   "C2":"They had planned to go outside earlier."},

  {"ItemID":"F06","Group":"Filler","Type":"filler",
   "Sentence":"Emma took the earlier flight.",
   "C1":"She wanted to avoid arriving late.",
   "C2":"The earlier flight was slightly cheaper."},

  {"ItemID":"F07","Group":"Filler","Type":"filler",
   "Sentence":"The library closed earlier than usual.",
   "C1":"There was a technical problem with the heating.",
   "C2":"The staff announced the closing time in advance."},

  {"ItemID":"F08","Group":"Filler","Type":"filler",
   "Sentence":"Daniel changed his workout routine.",
   "C1":"His old one had become too repetitive.",
   "C2":"He exercises several times a week."},

  {"ItemID":"F09","Group":"Filler","Type":"filler",
   "Sentence":"The restaurant was fully booked.",
   "C1":"A large group had made a reservation.",
   "C2":"The restaurant is popular on weekends."},

  {"ItemID":"F10","Group":"Filler","Type":"filler",
   "Sentence":"Laura decided to work from home.",
   "C1":"She wasn’t feeling very well.",
   "C2":"She logged into her email that morning."},

  {"ItemID":"F11","Group":"Filler","Type":"filler",
   "Sentence":"The concert started later than planned.",
   "C1":"There were technical issues with the sound system.",
   "C2":"The band had rehearsed earlier that day."},

  {"ItemID":"F12","Group":"Filler","Type":"filler",
   "Sentence":"Max brought a jacket with him.",
   "C1":"The weather forecast was uncertain.",
   "C2":"The jacket matched his shoes."},

  {"ItemID":"F13","Group":"Filler","Type":"filler",
   "Sentence":"The shop closed early that evening.",
   "C1":"There was a power outage in the area.",
   "C2":"Customers had already left the shop."},

  {"ItemID":"F14","Group":"Filler","Type":"filler",
   "Sentence":"Sophie chose the window seat.",
   "C1":"She likes having a view during the flight.",
   "C2":"The window seat was still available."},

  {"ItemID":"F15","Group":"Filler","Type":"filler",
   "Sentence":"The lecture ended earlier than expected.",
   "C1":"The main topics had already been covered.",
   "C2":"The lecturer spoke very clearly."},

  {"ItemID":"F16","Group":"Filler","Type":"filler",
   "Sentence":"Jonas ordered a coffee.",
   "C1":"He needed something to stay awake.",
   "C2":"The café also served fresh pastries."},

  {"ItemID":"F17","Group":"Filler","Type":"filler",
   "Sentence":"The package arrived in the morning.",
   "C1":"It had been shipped earlier than planned.",
   "C2":"The delivery service operates every day."},

  {"ItemID":"F18","Group":"Filler","Type":"filler",
   "Sentence":"Mia stayed after class.",
   "C1":"She wanted to ask the teacher a question.",
   "C2":"Other students had already left."},

  {"ItemID":"F19","Group":"Filler","Type":"filler",
   "Sentence":"The alarm went off unexpectedly.",
   "C1":"Someone had opened the back door.",
   "C2":"The alarm system was recently installed."},

  {"ItemID":"F20","Group":"Filler","Type":"filler",
   "Sentence":"Alex missed the bus.",
   "C1":"He left the house later than usual.",
   "C2":"The bus route passes through the city centre."}
]

stims.extend(fillers)

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    out.write("var all_stims = [\n")
    for i, o in enumerate(stims):
        out.write("  {\n")
        for k in o:
            v = o[k]
            if isinstance(v, int):
                out.write(f'    "{k}": {v},\n')
            else:
                out.write(f'    "{k}": "{js_escape(str(v))}",\n')
        out.write("  }" + ("," if i < len(stims) - 1 else "") + "\n")
    out.write("];\n")

print("Done.")
print("Total items:", len(stims))
print("Critical:", sum(1 for s in stims if s["Type"] == "critical"))
print("Fillers:", sum(1 for s in stims if s["Type"] == "filler"))
print("Lists:", sorted({int(s["List"]) for s in stims if s["Type"] == "critical"}))
