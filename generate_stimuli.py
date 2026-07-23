import csv
from pathlib import Path


CRITICAL_CSV = "data/exp1_dataset_with_audio_paths.csv"
FILLER_CSV = "data/exp1_fillers_with_audio_paths.csv"

OUTPUT_FILE = "experiments/01_f/js/stimuli.js"
EXPERIMENT_DIR = Path("experiments/01_f")


GROUP_ID_RANGES = {
    "Subject":   list(map(str, range(1, 16))),
    "VP":        list(map(str, range(16, 31))),
    "Object":    list(map(str, range(31, 46))),
    "Adjective": list(map(str, range(46, 61))),
    "Adjunct":   list(map(str, range(61, 76))),
}


GROUP_INDEX = {
    group: {
        rid: i + 1
        for i, rid in enumerate(rids)
    }
    for group, rids in GROUP_ID_RANGES.items()
}


def variant_for_item(
    list_no: int,
    item_index_within_group: int,
) -> str:
    """
    Each list contains two consecutive items per group.

    The item whose within-group index matches the list number
    is presented in the neutral condition.

    The following cyclic item is presented in the focus condition.

    This gives every list:
    - 5 neutral critical trials
    - 5 focus critical trials

    Across all lists, every item appears once as neutral and
    once as focus.
    """
    if item_index_within_group == list_no:
        return "neutral"

    return "focus"


def two_items_for_list(
    rids: list[str],
    list_no: int,
) -> list[str]:
    """
    List 1 receives items 1 and 2.
    List 2 receives items 2 and 3.
    ...
    List 15 receives items 15 and 1.
    """
    i1 = list_no - 1
    i2 = list_no % 15

    return [
        rids[i1],
        rids[i2],
    ]


def clean(value) -> str:
    if value is None:
        return ""

    return str(value).strip()


def js_escape(s: str) -> str:
    return (
        s
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "")
    )


# ---------------------------------------------------------------------
# Read critical items
# ---------------------------------------------------------------------

rows = {}

with open(
    CRITICAL_CSV,
    newline="",
    encoding="utf-8-sig",
) as f:
    reader = csv.DictReader(
        f,
        delimiter=";",
    )

    required_columns = {
        "ID",
        "group",
        "neutral_s",
        "focus_s",
        "f_marking (via all caps)",
        "C1 (focus-supported)",
        "C2 (focus-contradicting)",
        "neutral_audio_path",
        "focus_audio_path",
    }

    missing_columns = required_columns - set(
        reader.fieldnames or []
    )

    if missing_columns:
        raise ValueError(
            "Critical CSV is missing columns: "
            + ", ".join(sorted(missing_columns))
        )

    for r in reader:
        rid = clean(r["ID"])

        if not rid:
            continue

        rows[rid] = {
            "Group": clean(r["group"]),
            "NeutralSentence": clean(r["neutral_s"]),
            "CleftSentence": clean(r["focus_s"]),
            "FocusedSentence": clean(
                r["f_marking (via all caps)"]
            ),
            "C1": clean(
                r["C1 (focus-supported)"]
            ),
            "C2": clean(
                r["C2 (focus-contradicting)"]
            ),
            "neutral_audio_path": clean(
                r["neutral_audio_path"]
            ),
            "focus_audio_path": clean(
                r["focus_audio_path"]
            ),
        }


# ---------------------------------------------------------------------
# Check that all 75 required critical items exist
# ---------------------------------------------------------------------

missing = []

for group, rids in GROUP_ID_RANGES.items():
    for rid in rids:
        if rid not in rows:
            missing.append(
                (group, rid)
            )

if missing:
    msg = "\n".join(
        f"- Missing ID {rid} for group {group}"
        for group, rid in missing
    )

    raise ValueError(
        "Your CSV is missing required IDs "
        "for the 15-list design:\n"
        + msg
    )


# ---------------------------------------------------------------------
# Generate critical stimuli
# ---------------------------------------------------------------------

stims = []

for list_no in range(1, 16):
    for group in [
        "Subject",
        "VP",
        "Object",
        "Adjective",
        "Adjunct",
    ]:
        rids = GROUP_ID_RANGES[group]

        chosen_rids = two_items_for_list(
            rids,
            list_no,
        )

        for rid in chosen_rids:
            idx = GROUP_INDEX[group][rid]

            variant = variant_for_item(
                list_no,
                idx,
            )

            if variant == "neutral":
                audio_path = rows[rid][
                    "neutral_audio_path"
                ]
            else:
                audio_path = rows[rid][
                    "focus_audio_path"
                ]

            if not audio_path:
                raise ValueError(
                    f"Missing {variant} audio path "
                    f"for critical item {rid}."
                )

            stims.append({
                "ItemID": rid,
                "Group": group,
                "Type": "critical",
                "List": list_no,
                "Variant": variant,
                "AudioPath": audio_path,

                # Retained in the results for checking and analysis.
                # These fields are not shown to participants.
                "NeutralSentence": rows[rid][
                    "NeutralSentence"
                ],
                "CleftSentence": rows[rid][
                    "CleftSentence"
                ],
                "FocusedSentence": rows[rid][
                    "FocusedSentence"
                ],

                "C1": rows[rid]["C1"],
                "C2": rows[rid]["C2"],
            })


# ---------------------------------------------------------------------
# Read filler stimuli
# ---------------------------------------------------------------------

fillers = []

with open(
    FILLER_CSV,
    newline="",
    encoding="utf-8-sig",
) as f:
    reader = csv.DictReader(
        f,
        delimiter=";",
    )

    required_columns = {
        "ItemID",
        "Type",
        "FillerType",
        "Sentence",
        "C1",
        "C2",
        "audio_path",
    }

    missing_columns = required_columns - set(
        reader.fieldnames or []
    )

    if missing_columns:
        raise ValueError(
            "Filler CSV is missing columns: "
            + ", ".join(sorted(missing_columns))
        )

    for r in reader:
        item_id = clean(r["ItemID"])

        if not item_id:
            continue

        audio_path = clean(
            r["audio_path"]
        )

        if not audio_path:
            raise ValueError(
                f"Missing audio path for filler {item_id}."
            )

        fillers.append({
            "ItemID": item_id,
            "Group": "Filler",
            "Type": "filler",
            "FillerType": clean(
                r["FillerType"]
            ),
            "List": None,
            "Variant": "filler",
            "AudioPath": audio_path,
            "SpokenSentence": clean(
                r["Sentence"]
            ),
            "C1": clean(r["C1"]),
            "C2": clean(r["C2"]),
        })


stims.extend(fillers)


# ---------------------------------------------------------------------
# Check that all referenced audio files exist
# ---------------------------------------------------------------------

missing_audio = []

for stim in stims:
    audio_path = stim["AudioPath"]
    full_path = EXPERIMENT_DIR / audio_path

    if not full_path.exists():
        missing_audio.append(
            (
                stim["ItemID"],
                stim["Variant"],
                str(full_path),
            )
        )

if missing_audio:
    msg = "\n".join(
        f"- {item_id} ({variant}): {path}"
        for item_id, variant, path in missing_audio
    )

    raise FileNotFoundError(
        "The following referenced audio files "
        "do not exist:\n"
        + msg
    )


# ---------------------------------------------------------------------
# Validate the counterbalancing
# ---------------------------------------------------------------------

counterbalancing_errors = []

for list_no in range(1, 16):
    list_stims = [
        stim
        for stim in stims
        if (
            stim["Type"] == "critical"
            and stim["List"] == list_no
        )
    ]

    neutral_count = sum(
        stim["Variant"] == "neutral"
        for stim in list_stims
    )

    focus_count = sum(
        stim["Variant"] == "focus"
        for stim in list_stims
    )

    if len(list_stims) != 10:
        counterbalancing_errors.append(
            f"List {list_no} contains "
            f"{len(list_stims)} critical trials."
        )

    if neutral_count != 5:
        counterbalancing_errors.append(
            f"List {list_no} contains "
            f"{neutral_count} neutral trials."
        )

    if focus_count != 5:
        counterbalancing_errors.append(
            f"List {list_no} contains "
            f"{focus_count} focus trials."
        )


item_condition_counts = {
    rid: {
        "neutral": 0,
        "focus": 0,
    }
    for group_rids in GROUP_ID_RANGES.values()
    for rid in group_rids
}

for stim in stims:
    if stim["Type"] != "critical":
        continue

    item_condition_counts[
        stim["ItemID"]
    ][
        stim["Variant"]
    ] += 1


for rid, counts in item_condition_counts.items():
    if counts["neutral"] != 1:
        counterbalancing_errors.append(
            f"Item {rid} occurs "
            f"{counts['neutral']} times as neutral."
        )

    if counts["focus"] != 1:
        counterbalancing_errors.append(
            f"Item {rid} occurs "
            f"{counts['focus']} times as focus."
        )


if counterbalancing_errors:
    raise ValueError(
        "Counterbalancing validation failed:\n"
        + "\n".join(
            f"- {error}"
            for error in counterbalancing_errors
        )
    )


# ---------------------------------------------------------------------
# Write stimuli.js
# ---------------------------------------------------------------------

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8",
) as out:
    out.write(
        "var all_stims = [\n"
    )

    for i, o in enumerate(stims):
        out.write("  {\n")

        entries = list(o.items())

        for entry_index, (key, value) in enumerate(
            entries
        ):
            comma = (
                ","
                if entry_index < len(entries) - 1
                else ""
            )

            if value is None:
                out.write(
                    f'    "{key}": null{comma}\n'
                )

            elif isinstance(value, int):
                out.write(
                    f'    "{key}": {value}{comma}\n'
                )

            else:
                escaped_value = js_escape(
                    str(value)
                )

                out.write(
                    f'    "{key}": '
                    f'"{escaped_value}"{comma}\n'
                )

        final_comma = (
            ","
            if i < len(stims) - 1
            else ""
        )

        out.write(
            f"  }}{final_comma}\n"
        )

    out.write("];\n")


# ---------------------------------------------------------------------
# Print summary
# ---------------------------------------------------------------------

print("Done.")
print("Output file:", OUTPUT_FILE)
print("Total items:", len(stims))

print(
    "Critical:",
    sum(
        1
        for stim in stims
        if stim["Type"] == "critical"
    ),
)

print(
    "Fillers:",
    sum(
        1
        for stim in stims
        if stim["Type"] == "filler"
    ),
)

print(
    "Lists:",
    sorted({
        int(stim["List"])
        for stim in stims
        if stim["Type"] == "critical"
    }),
)


for list_no in range(1, 16):
    list_stims = [
        stim
        for stim in stims
        if (
            stim["Type"] == "critical"
            and stim["List"] == list_no
        )
    ]

    neutral_count = sum(
        stim["Variant"] == "neutral"
        for stim in list_stims
    )

    focus_count = sum(
        stim["Variant"] == "focus"
        for stim in list_stims
    )

    print(
        f"List {list_no}: "
        f"{len(list_stims)} critical trials, "
        f"{neutral_count} neutral, "
        f"{focus_count} focus"
    )


print(
    "Counterbalancing check passed: "
    "every critical item occurs once as neutral "
    "and once as focus."
)
