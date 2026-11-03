# Khuluma AAC

An eye-gaze-first communication board for children with cerebral palsy and CVI, in English and Afrikaans.

- 60 core words in fixed positions that scale from 9 to 60 buttons
- Sentence builder for English and Afrikaans ("Ek wil nie brood eet nie")
- Library of word lists and 21 topics, QuickFires, keyboard with word prediction
- Next row that suggests and learns the child's own word pairs
- CVI mode: black background, 1–6 items, chosen highlight colour, silhouettes, movement, visual field placement
- Eye gaze (iPad Eye Tracking or app dwell), switch scanning and touch
- "Where it hurts" body map with pain diary, visual scenes, real photos and recorded family voices
- Therapy insights and backup, all stored on the device

## Run it

It is a single static page: `index.html`. Vercel and Netlify serve it as is.
Recording a voice with **Record now** needs HTTPS, which Vercel provides.

On the iPad: open the site in Safari › Share › Add to Home Screen.
On the Mac: open the site in Safari › File › Add to Dock.

## Edit it

The source is in `src/`: `vocab.js` (words, translations, grammar), `app.js` (the board), `shell.html` and `style.css` (layout and design).
After changing them, run `python3 src/build.py` to rebuild `index.html`.

The Afrikaans vocabulary and sentence rules should be checked by a speech-language therapist before clinical use.
