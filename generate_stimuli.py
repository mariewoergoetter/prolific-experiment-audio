import csv
from pathlib import Path


CRITICAL_CSV = Path("data/exp1_dataset_with_audio_paths.csv")
FILLER_CSV = Path("data/exp1_fillers_with_audio_paths.csv")
OUTPUT_FILE = Path("experiments/01_f/js/stimuli.js")


GROUP_ID_RANGES = {
    "Subject": list(map(str, range(1, 16))),
    "VP": list(map(str, range(16, 31))),
    "Object": list(map(str, range(31, 46))),
    "Adjective": list(map(str, range(46, 61))),
    "Adjunct": list(map(str, range(61, 76))),
}


GROUP_INDEX = {
    group: {
        item_id: index + 1
        for index, item_id in enumerate(item_ids)
    }
    for group, item_ids in GROUP_ID_RANGES.items()
}


def clean(value) -> str:
    if value is None:
        return ""

    return str(value).strip()


def js_escape(value: str) -> str:
    return (
        value
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "")
    )


def variant_for_item(
    list_number: int,
    item_index_within_group: int,
) -> str:
    """
    Counterbalance neutral and focus versions across lists.
    """
    if (list_number + item_index_within_group) % 2 == 0:
        return "focus"

    return "neutral"


def two_items_for_list(
    item_ids: list[str],
    list_number: int,
) -> list[str]:
    """
    Select two cyclic items from each syntactic group.
    """
    first_index = list_number - 1
    second_index = list_number % len(item_ids)

    return [
        item_ids[first_index],
        item_ids[second_index],
    ]


def read_critical_items() -> dict[str, dict]:
    items = {}

    with CRITICAL_CSV.open(
        newline="",
        encoding="utf-8-sig",
    ) as file:
        reader = csv.DictReader(file, delimiter=";")

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

        for row in reader:
            item_id = clean(row["ID"])

            items[item_id] = {
                "Group": clean(row["group"]),
                "NeutralSentence": clean(row["neutral_s"]),
                "CleftSentence": clean(row["focus_s"]),
                "FocusedSentence": clean(
                    row["f_marking (via all caps)"]
                ),
                "C1": clean(
                    row["C1 (focus-supported)"]
                ),
                "C2": clean(
                    row["C2 (focus-contradicting)"]
                ),
                "NeutralAudioPath": clean(
                    row["neutral_audio_path"]
                ),
                "FocusAudioPath": clean(
                    row["focus_audio_path"]
                ),
            }

    return items


def validate_critical_items(
    items: dict[str, dict],
) -> None:
    missing_items = []

    for group, item_ids in GROUP_ID_RANGES.items():
        for item_id in item_ids:
            if item_id not in items:
                missing_items.append((group, item_id))

    if missing_items:
        formatted = "\n".join(
            f"- Missing ID {item_id} for group {group}"
            for group, item_id in missing_items
        )

        raise ValueError(
            "The critical CSV is missing required items:\n"
            + formatted
        )

    for item_id, item in items.items():
        if not item["NeutralAudioPath"]:
            raise ValueError(
                f"Item {item_id} has no neutral audio path."
            )

        if not item["FocusAudioPath"]:
            raise ValueError(
                f"Item {item_id} has no focus audio path."
            )


def create_critical_stimuli(
    items: dict[str, dict],
) -> list[dict]:
    stimuli = []

    group_order = [
        "Subject",
        "VP",
        "Object",
        "Adjective",
        "Adjunct",
    ]

    for list_number in range(1, 16):
        for group in group_order:
            selected_ids = two_items_for_list(
                GROUP_ID_RANGES[group],
                list_number,
            )

            for item_id in selected_ids:
                item_index = GROUP_INDEX[group][item_id]

                variant = variant_for_item(
                    list_number,
                    item_index,
                )

                item = items[item_id]

                if variant == "focus":
                    audio_path = item["FocusAudioPath"]
                else:
                    audio_path = item["NeutralAudioPath"]

                stimuli.append({
                    "ItemID": item_id,
                    "Group": group,
                    "Type": "critical",
                    "List": list_number,
                    "Variant": variant,
                    "AudioPath": audio_path,

                    # Retained for analysis/debugging only.
                    "NeutralSentence": item["NeutralSentence"],
                    "CleftSentence": item["CleftSentence"],
                    "FocusedSentence": item["FocusedSentence"],

                    "C1": item["C1"],
                    "C2": item["C2"],
                })

    return stimuli


def read_fillers() -> list[dict]:
    fillers = []

    with FILLER_CSV.open(
        newline="",
        encoding="utf-8-sig",
    ) as file:
        reader = csv.DictReader(file, delimiter=";")

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

        for row in reader:
            item_id = clean(row["ItemID"])
            audio_path = clean(row["audio_path"])

            if not audio_path:
                raise ValueError(
                    f"Filler {item_id} has no audio path."
                )

            fillers.append({
                "ItemID": item_id,
                "Group": "Filler",
                "Type": clean(row["Type"]),
                "FillerType": clean(row["FillerType"]),
                "List": None,
                "Variant": "filler",
                "AudioPath": audio_path,

                # Retained for analysis/debugging only.
                "SpokenSentence": clean(row["Sentence"]),

                "C1": clean(row["C1"]),
                "C2": clean(row["C2"]),
            })

    return fillers


def write_stimuli_js(
    stimuli: list[dict],
) -> None:
    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
    ) as output:
        output.write("var all_stims = [\n")

        for stimulus_index, stimulus in enumerate(stimuli):
            output.write("  {\n")

            properties = list(stimulus.items())

            for property_index, (key, value) in enumerate(
                properties
            ):
                comma = (
                    ","
                    if property_index < len(properties) - 1
                    else ""
                )

                if value is None:
                    output.write(
                        f'    "{key}": null{comma}\n'
                    )

                elif isinstance(value, int):
                    output.write(
                        f'    "{key}": {value}{comma}\n'
                    )

                else:
                    escaped = js_escape(str(value))

                    output.write(
                        f'    "{key}": "{escaped}"{comma}\n'
                    )

            item_comma = (
                ","
                if stimulus_index < len(stimuli) - 1
                else ""
            )

            output.write(f"  }}{item_comma}\n")

        output.write("];\n")


def validate_audio_files(
    stimuli: list[dict],
) -> None:
    experiment_folder = Path("experiments/01_f")
    missing_audio = []

    for stimulus in stimuli:
        relative_path = stimulus["AudioPath"]
        full_path = experiment_folder / relative_path

        if not full_path.exists():
            missing_audio.append(
                f"{stimulus['ItemID']}: {full_path}"
            )

    if missing_audio:
        formatted = "\n".join(
            f"- {entry}"
            for entry in missing_audio
        )

        raise FileNotFoundError(
            "The following audio files are missing:\n"
            + formatted
        )


def main() -> None:
    critical_items = read_critical_items()
    validate_critical_items(critical_items)

    critical_stimuli = create_critical_stimuli(
        critical_items
    )

    filler_stimuli = read_fillers()

    all_stimuli = (
        critical_stimuli
        + filler_stimuli
    )

    validate_audio_files(all_stimuli)
    write_stimuli_js(all_stimuli)

    print("Done.")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"Critical records: {len(critical_stimuli)}")
    print(f"Filler records: {len(filler_stimuli)}")
    print(f"Total records: {len(all_stimuli)}")

    for list_number in range(1, 16):
        list_items = [
            stimulus
            for stimulus in critical_stimuli
            if stimulus["List"] == list_number
        ]

        neutral_count = sum(
            stimulus["Variant"] == "neutral"
            for stimulus in list_items
        )

        focus_count = sum(
            stimulus["Variant"] == "focus"
            for stimulus in list_items
        )

        print(
            f"List {list_number}: "
            f"{len(list_items)} critical trials, "
            f"{neutral_count} neutral, "
            f"{focus_count} focus"
        )


if __name__ == "__main__":
    main()
