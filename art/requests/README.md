# Image requests

Landfall's pictures are made on Lachlan's PC now (local Qwen-Image-2.1, ART.md "Local pipeline"), not in the cloud.
A session that adds something needing a picture **does not paint it**. It writes the subject where it always went and
lodges a request here; the local pipeline picks the requests up, paints them, and they go in once Lachlan approves.

Do not call Atlas Cloud (or any other image API) unless Lachlan asks for it in so many words.

## How to lodge one

1. Write the picture's subject in `tools/scenes.py` as before: a storylet scene in `STORY`, a frame in `FRAMES`, a
   crew scene aboard ship in `CREW` and `STORY`, an officer variant in `CAST_SCENES`. The subject is the prompt; follow
   DESIGN.md "Scene art" and the rules in `tools/scenes.py` (`NO_BEAST`, `RED_MOON`, never paint the dreads).
2. Add one file here, `art/requests/<id>.json`, named after the picture's id (the `art/scenes/<id>.webp` it will
   become). One file per picture, so parallel sessions never collide.
3. Use the id in the code as if the picture existed. Until it is painted the card shows no picture (`LF.SCENES`
   in `js/scenes.js` lists what is on disk), so nothing breaks.

```json
{
  "id": "hu_lantern",
  "kind": "scene",
  "size": "wide",
  "subject_in": "tools/scenes.py STORY",
  "subject": "only if it is not in scenes.py: the picture in words, as a scenes.py subject would be",
  "card": "hu.lantern (js/thread-hunter.js)",
  "setting": "planet",
  "officers": [],
  "notes": "anything the painter should know: the mood, what must be visible, what must not",
  "requested": "2026-11-18, session or branch name"
}
```

- `kind`: `scene` (a decision-card picture), `officer_scene` (`<scene>@<officer>`), `portrait`, `icon`, `other`.
- `size`: `wide` (3:2, almost everything) or `square` (portraits).
- `setting`: `planet` or `ship`. Aboard the Ariadne the officers wear their ship jumpsuits; on the planet, their own
  clothes. It decides which reference portraits are used.
- `officers`: the cast keys in the picture, in the order the subject names them (`solheim`, `dahl`, `kovacs`,
  `nakamura`, `yurbin`, `estrada`, or the alternates `achebe`, `zulu`, `halloran`, `brandt`, `iyer`, `waititi`). The
  keys are the old surnames; the people are Jane Haddy, Nolan Edney, Jeremy Donadini, Andrea Tete, Mac O'Hagan, Samuel
  Barlow, and Lucas McMurray, Toby O'Neal, Roberta Craigie, Lou Chang, Michelle Yin, Hamond Shepherd. Say `old` (from
  year ten) where it matters; there is no `mid`.

## How they are picked up (Lachlan's PC)

`python D:\ai\landfall_regen\regen.py --requests` reads every file here, paints each picture, and adds it to the
review page. Approved pictures are exported to `art/scenes/<id>.webp`, `js/scenes.js` is rewritten by
`tools/scenes.py export`, and the request file is deleted in the same commit.
