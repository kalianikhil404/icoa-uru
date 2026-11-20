# Icoa-Uru Pattern Studio

A desktop app for designing loom bracelet patterns bead by bead. It works on its own: no website, no internet, no install needed.

## Using it

- **Icoa-Uru Pattern Studio.exe** runs straight away. Copy it to a USB stick, email it, or put it in a shared folder. It takes a few seconds to open because it unpacks itself each time.
- **Icoa-Uru Pattern Studio Setup.exe** installs it properly, with a desktop and Start menu shortcut. It opens faster after you install it, and you don't need to be an admin.

Windows may say "Windows protected your PC" the first time, because the app isn't signed by a paid certificate. Click **More info**, then **Run anyway**.

Your patterns, sprites and colours are saved on the computer automatically. Both versions share them. Use **⋮ → Back up everything to a file** to move them to another computer.

## Selecting, copying and sprites

| | |
|---|---|
| Select, Free select, Magic wand | M, Q, W (top of the left toolbar) |
| Add to / take away from a selection | Shift + drag, Alt + drag |
| Copy, Cut, Paste | Ctrl C, Ctrl X, Ctrl V |
| Move a selection | Drag it, or use the arrow keys (Shift = 5 beads) |
| Move a copy | Alt + drag |
| Flip, turn | H, V, [ and ] |
| Put it down / cancel | Enter / Esc |
| Save as a sprite | Ctrl E |
| Everything else | Right click, or press ? |

**Sprites** are saved pieces, like a tree or a heart, that you can reuse in any pattern. They're in the strip under the pattern:

- Click a sprite to place it (click as many times as you like, Esc when done). You can also drag it onto the pattern.
- **Repeat along the band** fills the whole bracelet with it.
- The **sliders** button on a sprite opens Customise: rename it, group it, change any colour, add an outline, flip, turn, make it twice as big, or trim it.
- The **heart** marks a favourite. Favourites show first.
- **Export** saves all your sprites to one file you can send to someone; **Import** adds theirs.

## Making a new version of the app (optional)

You only need this if you change the code. Install Node.js 20 or newer from nodejs.org, double-click **Build Pattern Studio.bat** (in the **Source code** folder, or in `pattern-studio` on GitHub). The new .exe files appear in its `dist` folder.

- `src/studio.html` and `src/studio.js`: the app's screen and everything it does
- `src/seed-bead.ts`: draws the realistic beads
- `electron/`: the window and saving files on the computer
- `npm start` opens the app without building the .exe files
