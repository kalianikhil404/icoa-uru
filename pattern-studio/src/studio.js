/* =====================================================================
   ICOA-URU PATTERN STUDIO
   Paint loom bead patterns with real-looking Miyuki 11/0 seed beads.
   Plain JavaScript, no internet needed. Uses buildGeometry / shadeBead
   from the seed bead renderer above.
   ===================================================================== */
(function () {
  /* ---------------- settings ---------------- */
  const SIZES = [
    { label: "Mini", rows: 5 },
    { label: "Small", rows: 10 },
    { label: "Medium", rows: 15 },
    { label: "Standard", rows: 20 },
    { label: "Large", rows: 25 },
  ];
  const BEAD_MM = 2; // one bead along the band
  const ROW_MM = 1.4; // one row across the band
  const BASE_CELL = 22; // px per bead at 100%
  const MAX_UNDO = 300;

  /* Miyuki 11/0 style colours (names are descriptive, not catalogue numbers) */
  const PALETTE = [
    ["Snow white", "#fbfbf8", "opaque"],
    ["Bone", "#f1e9dc", "luster"],
    ["Cream", "#f3e3bf", "opaque"],
    ["Pearl", "#eef0ee", "luster"],
    ["Silver", "#b9bcc0", "metallic"],
    ["Gold", "#c9a14a", "metallic"],
    ["Bronze", "#8a5a35", "metallic"],
    ["Jet black", "#161515", "opaque"],
    ["Charcoal", "#4b4a4c", "matte"],
    ["Cocoa", "#4a2e22", "opaque"],
    ["Tan", "#c8a27a", "opaque"],
    ["Blush", "#f2bfcb", "luster"],
    ["Bubblegum", "#ef8fb0", "opaque"],
    ["Pink", "#e88aa6", "silverlined"],
    ["Berry red", "#d0213c", "opaque"],
    ["Ruby", "#b0122a", "silverlined"],
    ["Coral", "#f0735a", "opaque"],
    ["Clay", "#c65a42", "opaque"],
    ["Orange", "#f08a24", "opaque"],
    ["Marigold", "#e8a82a", "opaque"],
    ["Lemon", "#f2d64a", "opaque"],
    ["Lime", "#a6d46e", "opaque"],
    ["Leaf green", "#2f8f43", "opaque"],
    ["Emerald", "#0f7a4d", "silverlined"],
    ["Mint", "#9fd6c9", "matte"],
    ["Aqua", "#8fd8d2", "luster"],
    ["Turquoise", "#2bb3a7", "opaque"],
    ["Lagoon", "#2e7c79", "opaque"],
    ["Sky", "#7fc4ea", "transparent"],
    ["Cobalt", "#1f3da3", "silverlined"],
    ["Navy", "#1b2a5c", "opaque"],
    ["Lavender", "#a98fd6", "opaque"],
    ["Purple", "#6a3d9a", "silverlined"],
    ["Plum", "#5b2246", "opaque"],
  ].map(([name, hex, finish]) => ({ name, hex, finish }));

  const FINISH_NAMES = { opaque: "Opaque", luster: "Luster", silverlined: "Silver-lined", transparent: "Transparent", metallic: "Metallic", matte: "Matte" };

  const FONT = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
    F: ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
    G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
    H: ["10001", "10001", "11111", "10001", "10001", "10001", "10001"],
    I: ["111", "010", "010", "010", "010", "010", "111"],
    J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
    K: ["10001", "10010", "11100", "10010", "10001", "10001", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "01110", "00001", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    X: ["10001", "01010", "00100", "00100", "01010", "10001", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
    Z: ["11111", "00010", "00100", "01000", "10000", "10000", "11111"],
    0: ["01110", "10011", "10101", "10101", "11001", "10001", "01110"],
    1: ["010", "110", "010", "010", "010", "010", "111"],
    2: ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
    3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    6: ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
    7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
    "♥": ["01010", "11111", "11111", "01110", "00100", "00000", "00000"],
    "!": ["1", "1", "1", "1", "1", "0", "1"],
    "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
    ".": ["0", "0", "0", "0", "0", "0", "1"],
    "-": ["000", "000", "000", "111", "000", "000", "000"],
    "+": ["000", "000", "010", "111", "010", "000", "000"],
    "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
    "'": ["1", "1", "0", "0", "0", "0", "0"],
    " ": ["00", "00", "00", "00", "00", "00", "00"],
  };

  const TOOLS = [
    { id: "select", name: "Select", key: "M", icon: "select", hint: "Drag to select. Shift adds, Alt takes away. Drag a selection to move it, hold Alt to copy it. Right click for more." },
    { id: "lasso", name: "Free select", key: "Q", icon: "lasso", hint: "Draw around the beads you want. Shift adds, Alt takes away." },
    { id: "wand", name: "Magic wand", key: "W", icon: "wand", hint: "Click a colour to select it. Shift adds, Alt takes away." },
    { id: "pencil", name: "Pencil", key: "B", icon: "pencil", hint: "Click or drag to paint. Right click paints with the second colour." },
    { id: "fill", name: "Fill", key: "G", icon: "bucket", hint: "Fills an area of touching beads that share a colour." },
    { id: "eraser", name: "Eraser", key: "E", icon: "eraser", hint: "Paints the background colour." },
    { id: "picker", name: "Colour picker", key: "I", icon: "pipette", hint: "Click a bead to take its colour. Right click takes it as the second colour." },
    { id: "line", name: "Line", key: "L", icon: "line", hint: "Drag from one bead to another." },
    { id: "rect", name: "Rectangle", key: "R", icon: "rect", hint: "Drag from one corner to the other." },
    { id: "replace", name: "Swap a colour", key: "C", icon: "replace", hint: "Click a bead: every bead of that colour becomes your main colour." },
    { id: "text", name: "Letters", key: "T", icon: "type", hint: "Type a word, then click where it should start. Needs at least 7 rows." },
    { id: "place", name: "Place sprite", key: "", icon: "stamp", hidden: true, hint: "Click to place it. ] turns it, H and V flip it. Esc when done." },
  ];

  const ICONS = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    filePlus: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 18v-6"/>',
    library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
    folder: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    imageDown: '<path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19 3 3v-5.5"/><path d="m17 22 3-3"/><circle cx="9" cy="9" r="2"/>',
    printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    flipH: '<path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 20v2"/><path d="M12 14v2"/><path d="M12 8v2"/><path d="M12 2v2"/>',
    flipV: '<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/>',
    mirror: '<path d="M12 3v18"/><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    bucket: '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    pipette: '<path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>',
    line: '<path d="M5 19 19 5"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="5" r="1.5"/>',
    rect: '<rect x="4" y="5" width="16" height="14" rx="2"/>',
    replace: '<path d="M14 4c0-1.1.9-2 2-2"/><path d="M20 2c1.1 0 2 .9 2 2"/><path d="M22 8c0 1.1-.9 2-2 2"/><path d="M16 10c-1.1 0-2-.9-2-2"/><path d="m3 7 3 3 3-3"/><path d="M6 10V5c0-1.7 1.3-3 3-3h1"/><rect x="2" y="14" width="8" height="8" rx="2"/><path d="m21 17-3-3-3 3"/><path d="M18 14v5c0 1.7-1.3 3-3 3h-1"/>',
    type: '<path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
    open: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  };
  Object.assign(ICONS, {
    select: '<path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/>',
    lasso: '<path d="M7 22a5 5 0 0 1-2-4"/><path d="M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1"/><circle cx="5" cy="16" r="2"/>',
    wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    paste: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    rotateL: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    stamp: '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/>',
    upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    keyboard: '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
    outline: '<rect x="3" y="3" width="18" height="18" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
    bigger: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    trim: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
    pdf: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2a1.5 1.5 0 0 1 0 3H8v-5"/><path d="M14 11v5"/><path d="M14 11h2.5"/><path d="M14 13.5h2"/>',
    backup: '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/>',
  });
  const icon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  /* ---------------- small helpers ---------------- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = (hex) => {
    let h = String(hex || "").trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
    return /^[0-9a-f]{6}$/.test(h) ? "#" + h : null;
  };
  const rgbOf = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (r, g, b) => "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch (e) {
        return false;
      }
    },
  };
  const KEY = { lib: "icoa-studio:library", cur: "icoa-studio:current", custom: "icoa-studio:my-colours", prefs: "icoa-studio:prefs" };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------------- state ---------------- */
  const S = {
    id: null,
    name: "Untitled pattern",
    rows: 10,
    cols: 63,
    cells: [],
    primary: "#1f3da3",
    secondary: "#f1e9dc",
    bg: "#f1e9dc",
    tool: "pencil",
    lastTool: "pencil",
    brush: 1,
    mirror: "off", // off | h | v | both
    rectFill: false,
    text: "LOVE",
    textScale: 1,
    zoom: 1,
    grid: true,
    real: true,
    custom: [],
    savedSig: "",
    highlight: null,
    // selecting
    selMode: "new", // new | add | sub
    wandAll: false,
    skipBg: true,
    // sprites
    sprites: [],
    spriteQuery: "",
    spriteTag: "all",
    dockOpen: true,
  };
  let past = [];
  let future = [];

  const finishOf = (hex) => {
    const p = PALETTE.find((c) => c.hex === hex) || S.custom.find((c) => c.hex === hex);
    return p ? p.finish : "opaque";
  };
  const nameOf = (hex) => {
    const p = PALETTE.find((c) => c.hex === hex) || S.custom.find((c) => c.hex === hex);
    return p ? p.name : "Custom colour";
  };
  /** colour name inside a sentence: palette names in lower case, "My #ABCDEF" as is */
  const said = (hex) => (PALETTE.find((c) => c.hex === hex) ? nameOf(hex).toLowerCase() : nameOf(hex));
  const idx = (r, c) => r * S.cols + c;
  const sig = () => S.rows + "x" + S.cols + ":" + S.name + ":" + S.cells.join("");

  /* ---------------- history ---------------- */
  const snap = () => ({ rows: S.rows, cols: S.cols, cells: S.cells.slice() });
  function restore(s) {
    S.rows = s.rows;
    S.cols = s.cols;
    S.cells = s.cells.slice();
    if (sel && sel.length !== S.rows * S.cols) sel = null;
    changed(true);
  }
  let pending = null;
  /** Call before changing the pattern; returns a function that finishes the step. */
  function step() {
    const before = snap();
    pending = before;
    const done = function () {
      pending = null;
      const same = before.rows === S.rows && before.cols === S.cols && before.cells.every((v, i) => v === S.cells[i]);
      if (same) return false;
      past.push(before);
      if (past.length > MAX_UNDO) past.shift();
      future = [];
      changed(before.rows !== S.rows || before.cols !== S.cols);
      return true;
    };
    done.before = before;
    return done;
  }
  function edit(fn) {
    if (floating) commitFloating(false);
    const done = step();
    fn();
    return done();
  }
  function undo() {
    if (floating) return cancelFloating();
    if (pending || !past.length) return;
    future.push(snap());
    restore(past.pop());
  }
  function redo() {
    if (pending || !future.length) return;
    past.push(snap());
    restore(future.pop());
  }

  /* ---------------- bead sprites ---------------- */
  const geomCache = new Map();
  const spriteCache = new Map();
  const SPRITE_STEPS = [24, 32, 40, 48, 64, 80, 96, 128, 160];
  function beadImg(hex, finish, px) {
    const size = SPRITE_STEPS.find((s) => s >= px) || 160;
    const key = hex + "|" + finish + "|" + size;
    let c = spriteCache.get(key);
    if (!c) {
      let g = geomCache.get(size);
      if (!g) {
        g = buildGeometry(size, 0, 2);
        geomCache.set(size, g);
      }
      c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(shadeBead(g, hex, finish)), size, size), 0, 0);
      spriteCache.set(key, c);
    }
    return c;
  }
  /** A small bead picture for swatches (canvas element). */
  function swatchCanvas(hex, finish, size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    c.getContext("2d").drawImage(beadImg(hex, finish, size), 0, 0, size, size);
    return c;
  }

  /* ---------------- drawing ---------------- */
  const cv = $("#cv");
  const ctx = cv.getContext("2d");
  const RULER_T = 24;
  const RULER_L = 34;
  const PAD = 16;
  let hover = null; // {r, c}
  let drag = null; // {tool, button, start, last, done}

  function layout() {
    const cw = Math.max(6, Math.round(BASE_CELL * S.zoom));
    const ch = Math.max(4, Math.round((cw * ROW_MM) / BEAD_MM));
    const x0 = RULER_L + PAD;
    const y0 = RULER_T + PAD;
    return { cw, ch, x0, y0, w: x0 + S.cols * cw + PAD + 6, h: y0 + S.rows * ch + PAD + 6 };
  }
  let sized = "";
  function sizeCanvas(L) {
    const dpr = window.devicePixelRatio || 1;
    const key = L.w + "x" + L.h + "@" + dpr;
    if (key === sized) return dpr;
    sized = key;
    cv.width = Math.round(L.w * dpr);
    cv.height = Math.round(L.h * dpr);
    cv.style.width = L.w + "px";
    cv.style.height = L.h + "px";
    return dpr;
  }

  let raf = 0;
  const redraw = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  function draw() {
    raf = 0;
    const L = layout();
    const dpr = sizeCanvas(L);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);
    const { cw, ch, x0, y0 } = L;
    const W = S.cols * cw;
    const H = S.rows * ch;

    // the band, lying on the loom
    ctx.fillStyle = "#efe6da";
    roundRect(ctx, x0 - 7, y0 - 7, W + 14, H + 14, 10);
    ctx.fill();
    // warp threads between the rows
    ctx.strokeStyle = "rgba(74,46,34,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 0; r <= S.rows; r++) {
      const y = Math.round(y0 + r * ch) + 0.5;
      ctx.moveTo(x0 - 7, y);
      ctx.lineTo(x0 + W + 7, y);
    }
    ctx.stroke();

    // overlay: line / rectangle / letters preview, the floating piece, the sprite being placed
    const ghost = previewCells();
    const over = overlayCells();
    let shown = ghost;
    if (over) {
      shown = ghost || new Map();
      for (const [i, v] of over) shown.set(i, v);
    }

    // beads
    const sw = (cw * 1.03) / (2 / 2.2); // sprite size so the bead fills the bead's width
    const px = sw * dpr;
    for (let r = 0; r < S.rows; r++) {
      for (let c = 0; c < S.cols; c++) {
        const i = idx(r, c);
        const hex = shown && shown.has(i) ? shown.get(i) : S.cells[i];
        const cx = x0 + c * cw + cw / 2;
        const cy = y0 + r * ch + ch / 2;
        const dim = S.highlight && hex !== S.highlight;
        if (dim) ctx.globalAlpha = 0.18;
        if (S.real && cw >= 7) {
          ctx.drawImage(beadImg(hex, finishOf(hex), px), cx - sw / 2, cy - sw / 2, sw, sw);
        } else {
          ctx.fillStyle = hex;
          roundRect(ctx, x0 + c * cw + 0.5, y0 + r * ch + 0.5, cw - 1, ch - 1, Math.min(cw, ch) * 0.35);
          ctx.fill();
        }
        if (dim) ctx.globalAlpha = 1;
      }
    }

    // counting grid: every bead faint, every 5 stronger, every 10 strongest
    if (S.grid && cw >= 8) {
      for (const [every, alpha] of [
        [1, 0.07],
        [5, 0.2],
        [10, 0.38],
      ]) {
        ctx.strokeStyle = `rgba(74,46,34,${alpha})`;
        ctx.beginPath();
        for (let c = 0; c <= S.cols; c += every) {
          const x = Math.round(x0 + c * cw) + 0.5;
          ctx.moveTo(x, y0);
          ctx.lineTo(x, y0 + H);
        }
        if (every > 1)
          for (let r = 0; r <= S.rows; r += every) {
            const y = Math.round(y0 + r * ch) + 0.5;
            ctx.moveTo(x0, y);
            ctx.lineTo(x0 + W, y);
          }
        ctx.stroke();
      }
    }

    drawSelectionLayer(L);

    // rulers: bead numbers along the top, row numbers on the left
    ctx.fillStyle = "#8a7468";
    ctx.font = `${Math.max(9, Math.min(12, cw * 0.55))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const stepC = cw >= 20 ? 1 : cw >= 10 ? 5 : 10;
    for (let c = 0; c < S.cols; c++) {
      const n = c + 1;
      if (n === 1 || n % stepC === 0) {
        const bold = n % 10 === 0;
        ctx.fillStyle = bold ? "#4a2e22" : "#8a7468";
        ctx.fillText(String(n), x0 + c * cw + cw / 2, RULER_T / 2 + 6);
      }
    }
    ctx.textAlign = "right";
    const stepR = ch >= 11 ? 1 : 5;
    for (let r = 0; r < S.rows; r++) {
      const n = r + 1;
      if (n === 1 || n % stepR === 0) {
        ctx.fillStyle = n % 5 === 0 ? "#4a2e22" : "#8a7468";
        ctx.fillText(String(n), RULER_L + 4, y0 + r * ch + ch / 2);
      }
    }

    // hovered bead + crosshair on the rulers
    if (hover && !drag && !selTools.includes(S.tool) && S.tool !== "place") {
      const hx = x0 + hover.c * cw;
      const hy = y0 + hover.r * ch;
      ctx.fillStyle = "rgba(46,124,121,0.12)";
      ctx.fillRect(hx, RULER_T - 2, cw, 14);
      ctx.fillRect(PAD - 4, hy, RULER_L - PAD + 12, ch);
      const span = S.tool === "pencil" || S.tool === "eraser" ? S.brush : 1;
      const off = Math.floor((span - 1) / 2);
      ctx.strokeStyle = "#1f130e";
      ctx.lineWidth = 1.5;
      roundRect(ctx, hx - off * cw + 0.75, hy - off * ch + 0.75, cw * span - 1.5, ch * span - 1.5, 3);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1;
      roundRect(ctx, hx - off * cw + 2, hy - off * ch + 2, cw * span - 4, ch * span - 4, 2);
      ctx.stroke();
    }
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* ---------------- painting ---------------- */
  function inside(r, c) {
    return r >= 0 && c >= 0 && r < S.rows && c < S.cols;
  }
  function mirrored(r, c) {
    const out = [[r, c]];
    if (S.mirror === "h" || S.mirror === "both") out.push([r, S.cols - 1 - c]);
    if (S.mirror === "v" || S.mirror === "both") out.push([S.rows - 1 - r, c]);
    if (S.mirror === "both") out.push([S.rows - 1 - r, S.cols - 1 - c]);
    return out;
  }
  function setCell(r, c, hex, target) {
    for (const [rr, cc] of mirrored(r, c)) if (inside(rr, cc)) (target || S.cells)[idx(rr, cc)] = hex;
  }
  function stamp(r, c, hex) {
    const n = S.brush;
    const off = Math.floor((n - 1) / 2);
    for (let dr = 0; dr < n; dr++) for (let dc = 0; dc < n; dc++) setCell(r - off + dr, c - off + dc, hex);
  }
  function linePoints(a, b) {
    const pts = [];
    let x0 = a.c;
    let y0 = a.r;
    const x1 = b.c;
    const y1 = b.r;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      pts.push({ r: y0, c: x0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return pts;
  }
  function rectPoints(a, b, filled) {
    const pts = [];
    const r0 = Math.min(a.r, b.r);
    const r1 = Math.max(a.r, b.r);
    const c0 = Math.min(a.c, b.c);
    const c1 = Math.max(a.c, b.c);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (filled || r === r0 || r === r1 || c === c0 || c === c1) pts.push({ r, c });
    return pts;
  }
  function flood(r, c, hex) {
    const target = S.cells[idx(r, c)];
    if (target === hex) return;
    const stack = [[r, c]];
    const seen = new Uint8Array(S.cells.length);
    while (stack.length) {
      const [y, x] = stack.pop();
      if (!inside(y, x)) continue;
      const i = idx(y, x);
      if (seen[i] || S.cells[i] !== target) continue;
      seen[i] = 1;
      S.cells[i] = hex;
      stack.push([y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]);
    }
  }
  function textCells(at, hex) {
    const word = [...S.text.toUpperCase()].filter((ch) => FONT[ch]);
    const k = S.textScale;
    const out = new Map();
    let x = at.c;
    for (const ch of word) {
      const g = FONT[ch];
      for (let gy = 0; gy < g.length; gy++)
        for (let gx = 0; gx < g[gy].length; gx++)
          if (g[gy][gx] === "1")
            for (let a = 0; a < k; a++)
              for (let b = 0; b < k; b++) {
                const r = at.r + gy * k + a;
                const c = x + gx * k + b;
                if (inside(r, c)) out.set(idx(r, c), hex);
              }
      x += (g[0].length + 1) * k;
    }
    return out;
  }
  /** Cells that would change if the current drag (or the letters tool) were applied now. */
  function previewCells() {
    if (S.tool === "text" && hover && !drag) return textCells(hover, S.primary);
    if (!drag || !drag.last || (drag.tool !== "line" && drag.tool !== "rect")) return null;
    const hex = drag.button === 2 ? S.secondary : S.primary;
    const pts = drag.tool === "line" ? linePoints(drag.start, drag.last) : rectPoints(drag.start, drag.last, S.rectFill);
    const map = new Map();
    const tmp = S.cells.slice();
    for (const p of pts) setCell(p.r, p.c, hex, tmp);
    tmp.forEach((v, i) => {
      if (v !== S.cells[i]) map.set(i, v);
    });
    return map;
  }

  function cellAt(e) {
    const L = layout();
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left - L.x0;
    const y = e.clientY - rect.top - L.y0;
    const c = Math.floor(x / L.cw);
    const r = Math.floor(y / L.ch);
    return inside(r, c) ? { r, c } : null;
  }

  /** Position in beads (fractions allowed, may be outside the band). */
  function pointAt(e) {
    const L = layout();
    const rect = cv.getBoundingClientRect();
    return { x: (e.clientX - rect.left - L.x0) / L.cw, y: (e.clientY - rect.top - L.y0) / L.ch };
  }
  const clampCell = (pt) => ({ r: clamp(Math.floor(pt.y), 0, S.rows - 1), c: clamp(Math.floor(pt.x), 0, S.cols - 1) });
  const inFloating = (pt) => floating && pt.x >= floating.x && pt.x < floating.x + floating.w && pt.y >= floating.y && pt.y < floating.y + floating.h;

  cv.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (selTools.includes(S.tool)) selectionMenu(e);
  });
  cv.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    const pt = pointAt(e);
    // the floating piece can be dragged with any tool
    if (floating && e.button === 0 && inFloating(pt)) {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      drag = { tool: "moveFloat", start: { x: Math.floor(pt.x), y: Math.floor(pt.y) }, ox: floating.x, oy: floating.y };
      return;
    }
    if (e.button === 2 && selTools.includes(S.tool)) return; // context menu
    const at = cellAt(e);
    if (selTools.includes(S.tool)) {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      if (floating) commitFloating(false);
      const mode = e.shiftKey ? "add" : e.altKey && !(at && sel && sel[idx(at.r, at.c)]) ? "sub" : S.selMode;
      // drag an existing selection to move it (Alt = copy)
      if (at && sel && sel[idx(at.r, at.c)] && !e.shiftKey && mode !== "sub") {
        lift(e.altKey);
        drag = { tool: "moveFloat", start: { x: Math.floor(pt.x), y: Math.floor(pt.y) }, ox: floating.x, oy: floating.y };
        return;
      }
      const c0 = clampCell(pt);
      if (S.tool === "select") drag = { tool: "select", start: c0, last: c0, mode, moved: false };
      else if (S.tool === "lasso") drag = { tool: "lasso", pts: [pt], mode };
      else if (S.tool === "wand" && at) applySel(wandMask(at, S.wandAll), mode);
      redraw();
      return;
    }
    if (!at) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    if (S.tool === "place") {
      if (e.button === 2) return stopPlacing();
      placeAt(at);
      return;
    }
    if (floating) commitFloating(false);
    const button = e.button;
    const colour = S.tool === "eraser" ? S.bg : button === 2 ? S.secondary : S.primary;
    const here = S.cells[idx(at.r, at.c)];
    switch (S.tool) {
      case "pencil":
      case "eraser": {
        const done = step();
        stamp(at.r, at.c, colour);
        drag = { tool: S.tool, button, start: at, last: at, done, colour };
        changed(false, true);
        break;
      }
      case "fill":
        edit(() => {
          for (const [r, c] of mirrored(at.r, at.c)) if (inside(r, c)) flood(r, c, colour);
        });
        break;
      case "replace":
        if (here !== colour) {
          edit(() => {
            S.cells = S.cells.map((v) => (v === here ? colour : v));
          });
          toast(`Every ${said(here)} bead is now ${said(colour)}.`, true);
        }
        break;
      case "picker":
        if (button === 2) S.secondary = here;
        else S.primary = here;
        setTool(S.lastTool === "picker" ? "pencil" : S.lastTool);
        refreshColour();
        toast(`Picked ${nameOf(here)} ${here.toUpperCase()}`);
        break;
      case "line":
      case "rect":
        drag = { tool: S.tool, button, start: at, last: at };
        redraw();
        break;
      case "text": {
        if (S.rows < 7 * S.textScale) {
          toast(S.textScale > 1 ? "Big letters need at least 14 rows." : "Letters need at least 7 rows. Make the band wider in Size.");
          break;
        }
        const cells = textCells(at, colour);
        if (!cells.size) {
          toast("Type a word in the box above first.");
          break;
        }
        edit(() => cells.forEach((v, i) => (S.cells[i] = v)));
        break;
      }
    }
  });
  cv.addEventListener("pointermove", (e) => {
    const at = cellAt(e);
    const moved = (at && hover && at.r === hover.r && at.c === hover.c) || (!at && !hover) ? false : true;
    hover = at;
    if (moved) {
      showStatus();
      if (!drag) redraw();
    }
    if (drag && drag.tool === "moveFloat") {
      const pt = pointAt(e);
      const nx = clamp(drag.ox + Math.floor(pt.x) - drag.start.x, -floating.w + 1, S.cols - 1);
      const ny = clamp(drag.oy + Math.floor(pt.y) - drag.start.y, -floating.h + 1, S.rows - 1);
      if (nx !== floating.x || ny !== floating.y) {
        floating.x = nx;
        floating.y = ny;
        redraw();
      }
      return;
    }
    if (drag && drag.tool === "select") {
      const c = clampCell(pointAt(e));
      if (c.r !== drag.last.r || c.c !== drag.last.c) {
        drag.last = c;
        drag.moved = true;
        redraw();
      }
      return;
    }
    if (drag && drag.tool === "lasso") {
      const pt = pointAt(e);
      const last = drag.pts[drag.pts.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) > 0.25) {
        drag.pts.push({ x: clamp(pt.x, 0, S.cols), y: clamp(pt.y, 0, S.rows) });
        redraw();
      }
      return;
    }
    if (!drag || !at) return;
    if (drag.tool === "pencil" || drag.tool === "eraser") {
      if (at.r === drag.last.r && at.c === drag.last.c) return;
      for (const p of linePoints(drag.last, at)) stamp(p.r, p.c, drag.colour);
      drag.last = at;
      changed(false, true);
    } else if (drag.tool === "line" || drag.tool === "rect") {
      if (at.r !== drag.last.r || at.c !== drag.last.c) {
        drag.last = at;
        redraw();
      }
    }
  });
  function endDrag() {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.tool === "moveFloat") {
      renderOptions();
      return redraw();
    }
    if (d.tool === "select") {
      if (!d.moved && d.mode === "new") {
        sel = null;
        selChanged();
      } else applySel(rectMask(d.start, d.last), d.mode);
      return;
    }
    if (d.tool === "lasso") {
      applySel(lassoMask(d.pts), d.mode);
      return;
    }
    if (d.tool === "pencil" || d.tool === "eraser") d.done();
    else if (d.tool === "line" || d.tool === "rect") {
      const hex = d.button === 2 ? S.secondary : S.primary;
      const pts = d.tool === "line" ? linePoints(d.start, d.last) : rectPoints(d.start, d.last, S.rectFill);
      edit(() => pts.forEach((p) => setCell(p.r, p.c, hex)));
    }
    redraw();
  }
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);
  cv.addEventListener("pointerleave", () => {
    if (!drag) {
      hover = null;
      showStatus();
      redraw();
    }
  });

  /* =====================================================================
     SELECTING, COPY / PASTE, MOVING, AND SPRITES
     (inserted into studio.js by the build; shares its variables)
     ===================================================================== */

  /* ---------------- selection state ---------------- */
  let sel = null; // Uint8Array, 1 = selected bead
  let floating = null; // { w, h, cells: (hex|null)[], x, y, origin: "move" | "paste", done }
  let clip = null; // { w, h, cells }
  let place = null; // { id, name, w, h, cells } while placing a sprite
  let menuEl = null;

  const hasSel = () => !!sel && sel.some(Boolean);
  const selTools = ["select", "lasso", "wand"];

  function bounds(mask) {
    let r0 = Infinity, c0 = Infinity, r1 = -1, c1 = -1;
    for (let r = 0; r < S.rows; r++)
      for (let c = 0; c < S.cols; c++)
        if (mask[idx(r, c)]) {
          if (r < r0) r0 = r;
          if (r > r1) r1 = r;
          if (c < c0) c0 = c;
          if (c > c1) c1 = c;
        }
    return r1 < 0 ? null : { r0, c0, r1, c1 };
  }

  function applySel(mask, mode) {
    if (mode === "add" && sel) mask = sel.map((v, i) => (v || mask[i] ? 1 : 0));
    else if (mode === "sub") mask = sel ? sel.map((v, i) => (v && !mask[i] ? 1 : 0)) : null;
    sel = mask && mask.some(Boolean) ? Uint8Array.from(mask) : null;
    selChanged();
  }
  function rectMask(a, b) {
    const m = new Uint8Array(S.rows * S.cols);
    for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++)
      for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) if (inside(r, c)) m[idx(r, c)] = 1;
    return m;
  }
  function lassoMask(pts) {
    const m = new Uint8Array(S.rows * S.cols);
    if (pts.length < 3) return m;
    for (let r = 0; r < S.rows; r++)
      for (let c = 0; c < S.cols; c++) {
        const x = c + 0.5;
        const y = r + 0.5;
        let on = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const a = pts[i];
          const b = pts[j];
          if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) on = !on;
        }
        if (on) m[idx(r, c)] = 1;
      }
    return m;
  }
  function wandMask(at, everywhere) {
    const m = new Uint8Array(S.rows * S.cols);
    const target = S.cells[idx(at.r, at.c)];
    if (everywhere) {
      S.cells.forEach((v, i) => (m[i] = v === target ? 1 : 0));
      return m;
    }
    const stack = [[at.r, at.c]];
    while (stack.length) {
      const [r, c] = stack.pop();
      if (!inside(r, c)) continue;
      const i = idx(r, c);
      if (m[i] || S.cells[i] !== target) continue;
      m[i] = 1;
      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
    return m;
  }
  function selectAll() {
    commitFloating();
    applySel(new Uint8Array(S.rows * S.cols).fill(1), "new");
    if (!selTools.includes(S.tool)) setTool("select");
  }
  function deselect() {
    commitFloating();
    sel = null;
    selChanged();
  }
  function invertSel() {
    commitFloating();
    applySel(sel ? sel.map((v) => (v ? 0 : 1)) : new Uint8Array(S.rows * S.cols).fill(1), "new");
  }
  function selChanged() {
    renderOptions();
    ants(!!(sel || floating));
    redraw();
    showStatus();
  }

  /* marching ants around the selection */
  let antsTimer = 0;
  let antsOffset = 0;
  function ants(on) {
    if (on && !antsTimer)
      antsTimer = setInterval(() => {
        antsOffset = (antsOffset + 1) % 12;
        redraw();
      }, 110);
    if (!on && antsTimer) {
      clearInterval(antsTimer);
      antsTimer = 0;
    }
  }

  /* ---------------- pieces of pattern: { w, h, cells (hex or null = see-through) } ---------------- */

  /** The selected beads (or the floating piece) as a piece. Background beads become see-through if that option is on. */
  function selectionPiece() {
    if (floating) return { w: floating.w, h: floating.h, cells: floating.cells.slice() };
    if (!hasSel()) return null;
    const b = bounds(sel);
    const w = b.c1 - b.c0 + 1;
    const h = b.r1 - b.r0 + 1;
    const cells = new Array(w * h).fill(null);
    for (let r = b.r0; r <= b.r1; r++)
      for (let c = b.c0; c <= b.c1; c++) {
        const i = idx(r, c);
        if (!sel[i]) continue;
        const v = S.cells[i];
        cells[(r - b.r0) * w + (c - b.c0)] = S.skipBg && v === S.bg ? null : v;
      }
    return trimPiece({ w, h, cells });
  }

  const PIECE = {
    flipH: (p) => ({ w: p.w, h: p.h, cells: p.cells.map((_, i) => p.cells[Math.floor(i / p.w) * p.w + (p.w - 1 - (i % p.w))]) }),
    flipV: (p) => ({ w: p.w, h: p.h, cells: p.cells.map((_, i) => p.cells[(p.h - 1 - Math.floor(i / p.w)) * p.w + (i % p.w)]) }),
    rotR: (p) => {
      const out = new Array(p.w * p.h);
      for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) out[c * p.h + (p.h - 1 - r)] = p.cells[r * p.w + c];
      return { w: p.h, h: p.w, cells: out };
    },
    rotL: (p) => {
      const out = new Array(p.w * p.h);
      for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) out[(p.w - 1 - c) * p.h + r] = p.cells[r * p.w + c];
      return { w: p.h, h: p.w, cells: out };
    },
    double: (p) => {
      const w = p.w * 2;
      const h = p.h * 2;
      return { w, h, cells: Array.from({ length: w * h }, (_, i) => p.cells[Math.floor(Math.floor(i / w) / 2) * p.w + Math.floor((i % w) / 2)]) };
    },
    outline: (p, hex) => {
      const w = p.w + 2;
      const h = p.h + 2;
      const src = Array.from({ length: w * h }, (_, i) => {
        const r = Math.floor(i / w) - 1;
        const c = (i % w) - 1;
        return r >= 0 && c >= 0 && r < p.h && c < p.w ? p.cells[r * p.w + c] : null;
      });
      const out = src.slice();
      for (let r = 0; r < h; r++)
        for (let c = 0; c < w; c++) {
          if (src[r * w + c] != null) continue;
          const near = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([y, x]) => y >= 0 && x >= 0 && y < h && x < w && src[y * w + x] != null);
          if (near) out[r * w + c] = hex;
        }
      return trimPiece({ w, h, cells: out });
    },
    recolour: (p, from, to) => ({ w: p.w, h: p.h, cells: p.cells.map((v) => (v === from ? to : v)) }),
  };

  function trimPiece(p) {
    let r0 = 0, r1 = p.h - 1, c0 = 0, c1 = p.w - 1;
    const rowEmpty = (r) => p.cells.slice(r * p.w, r * p.w + p.w).every((v) => v == null);
    const colEmpty = (c) => Array.from({ length: p.h }, (_, r) => p.cells[r * p.w + c]).every((v) => v == null);
    while (r0 < r1 && rowEmpty(r0)) r0++;
    while (r1 > r0 && rowEmpty(r1)) r1--;
    while (c0 < c1 && colEmpty(c0)) c0++;
    while (c1 > c0 && colEmpty(c1)) c1--;
    const w = c1 - c0 + 1;
    const h = r1 - r0 + 1;
    const cells = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells.push(p.cells[r * p.w + c]);
    return { w, h, cells };
  }

  /* ---------------- floating piece (pasted, or a selection being moved) ---------------- */

  /** Lifts the selected beads so they can be moved. copy = leave the originals where they are. */
  function lift(copy) {
    if (floating || !hasSel()) return !!floating;
    const b = bounds(sel);
    const w = b.c1 - b.c0 + 1;
    const h = b.r1 - b.r0 + 1;
    const cells = new Array(w * h).fill(null);
    const done = step();
    for (let r = b.r0; r <= b.r1; r++)
      for (let c = b.c0; c <= b.c1; c++) {
        const i = idx(r, c);
        if (!sel[i]) continue;
        const v = S.cells[i];
        cells[(r - b.r0) * w + (c - b.c0)] = S.skipBg && v === S.bg ? null : v;
        if (!copy) S.cells[i] = S.bg;
      }
    floating = { w, h, cells, x: b.c0, y: b.r0, origin: "move", done };
    sel = null;
    changed(false, true);
    selChanged();
    return true;
  }

  function startFloating(piece, at, origin) {
    commitFloating();
    const done = step();
    const pos = at || hover || { r: Math.floor((S.rows - piece.h) / 2), c: visibleCol() };
    floating = {
      ...piece,
      cells: piece.cells.slice(),
      x: clamp(pos.c - Math.floor(piece.w / 2), -piece.w + 1, S.cols - 1),
      y: clamp(pos.r - Math.floor(piece.h / 2), -piece.h + 1, S.rows - 1),
      origin,
      done,
    };
    sel = null;
    if (!selTools.includes(S.tool)) setTool("select", true);
    selChanged();
  }

  function visibleCol() {
    const stageEl = $("#stage");
    const L = layout();
    const mid = (stageEl.scrollLeft + stageEl.clientWidth / 2 - 28 - L.x0) / L.cw;
    return clamp(Math.round(mid), 0, S.cols - 1);
  }

  /** Puts the floating piece down for good (it becomes the selection, like in Paint). */
  function commitFloating(keepSelection = true) {
    if (!floating) return;
    const f = floating;
    floating = null;
    const m = new Uint8Array(S.rows * S.cols);
    for (let j = 0; j < f.h; j++)
      for (let i = 0; i < f.w; i++) {
        const v = f.cells[j * f.w + i];
        const r = f.y + j;
        const c = f.x + i;
        if (v == null || !inside(r, c)) continue;
        S.cells[idx(r, c)] = v;
        m[idx(r, c)] = 1;
      }
    f.done();
    sel = keepSelection && m.some(Boolean) ? m : null;
    changed(false);
    selChanged();
  }
  /** Throws a pasted piece away / puts a moved selection back. */
  function cancelFloating() {
    if (!floating) return;
    const f = floating;
    floating = null;
    S.cells = f.done.before.cells.slice();
    pending = null;
    changed(false);
    selChanged();
  }
  /** Removes the floating piece, leaving the hole it came from (used by Cut / Delete). */
  function dropFloating() {
    if (!floating) return;
    const f = floating;
    floating = null;
    f.done();
    changed(false);
    selChanged();
  }
  function transformSelection(op) {
    if (!floating && !lift(false)) return toast("Select some beads first.");
    const centre = { x: floating.x + floating.w / 2, y: floating.y + floating.h / 2 };
    const next = PIECE[op](floating);
    floating = { ...floating, ...next, x: Math.round(centre.x - next.w / 2), y: Math.round(centre.y - next.h / 2) };
    selChanged();
  }
  function moveFloating(dx, dy) {
    if (!floating && !lift(false)) return;
    floating.x = clamp(floating.x + dx, -floating.w + 1, S.cols - 1);
    floating.y = clamp(floating.y + dy, -floating.h + 1, S.rows - 1);
    redraw();
  }

  /* ---------------- copy, cut, paste, delete ---------------- */

  function copySel() {
    const p = selectionPiece();
    if (!p) return false;
    clip = p;
    try {
      navigator.clipboard?.writeText("ICOA-PIECE:" + JSON.stringify(p)).catch(() => {});
    } catch (e) {}
    toast(`Copied ${p.cells.filter((v) => v != null).length} beads. Ctrl V pastes them.`);
    renderOptions();
    return true;
  }
  function cutSel() {
    if (!copySel()) return toast("Select some beads first.");
    deleteSel(true);
  }
  function deleteSel(quiet) {
    if (floating) {
      if (floating.origin === "move") dropFloating();
      else cancelFloating();
    } else if (hasSel()) {
      const m = sel;
      edit(() => m.forEach((v, i) => v && (S.cells[i] = S.bg)));
      sel = null;
      selChanged();
    } else return;
    if (!quiet) toast("Cleared to the background colour.", true);
  }
  async function pasteClip() {
    let piece = clip;
    if (!piece) {
      try {
        const t = await navigator.clipboard.readText();
        if (t && t.startsWith("ICOA-PIECE:")) piece = JSON.parse(t.slice(11));
      } catch (e) {}
    }
    if (!piece || !piece.w) return toast("Nothing copied yet. Select beads and press Ctrl C first.");
    startFloating(piece, hover, "paste");
    toast("Drag it where you want it, then press Enter (Esc cancels).");
  }
  function fillSel() {
    if (!hasSel()) return toast("Select some beads first.");
    const m = sel;
    edit(() => m.forEach((v, i) => v && (S.cells[i] = S.primary)));
  }

  /* ---------------- right-click menu for the selection tools ---------------- */

  /** A small colour chooser that pops up next to a button. Resolves to a colour, or null. */
  let pickerEl = null;
  const beadUrls = new Map();
  const beadUrl = (hex, finish) => {
    const k = hex + finish;
    if (!beadUrls.has(k)) beadUrls.set(k, beadImg(hex, finish || "opaque", 44).toDataURL());
    return beadUrls.get(k);
  };
  function pickColour(anchor, current, title) {
    pickerEl?.remove();
    return new Promise((resolve) => {
      const host = anchor.closest("dialog") || document.body;
      const pop = document.createElement("div");
      pop.className = "ctx swpick";
      const btn = (c) =>
        `<button type="button" class="swb${c.hex === current ? " on" : ""}" data-hex="${c.hex}" title="${escapeHtml(c.name)}" aria-label="${escapeHtml(c.name)}"><img src="${beadUrl(c.hex, c.finish)}" alt=""></button>`;
      pop.innerHTML =
        `<p class="swt">${escapeHtml(title || "Pick a colour")}</p><div class="swgrid">${PALETTE.map(btn).join("")}</div>` +
        (S.custom.length ? `<p class="swt">My colours</p><div class="swgrid">${S.custom.map(btn).join("")}</div>` : "") +
        `<div class="swfoot"><button type="button" class="mini" data-hex="${S.primary}"><span class="sw-dot" style="background:${S.primary}"></span> Main colour</button><input type="color" value="${current || S.primary}" aria-label="Any colour" title="Any colour"></div>`;
      const finish = (v) => {
        document.removeEventListener("pointerdown", outside, true);
        pop.remove();
        if (pickerEl === pop) pickerEl = null;
        resolve(v);
      };
      const outside = (e) => {
        if (!pop.contains(e.target)) finish(null);
      };
      pop.addEventListener("click", (e) => {
        const b = e.target.closest("[data-hex]");
        if (b) finish(b.dataset.hex);
      });
      pop.querySelector('input[type="color"]').addEventListener("change", (e) => finish(norm(e.target.value)));
      pop.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish(null);
        }
      });
      // shown in the top layer so it sits above dialogs and is never clipped
      pop.setAttribute("popover", "manual");
      host.append(pop);
      pickerEl = pop;
      try {
        pop.showPopover();
      } catch {}
      const a = anchor.getBoundingClientRect();
      const r = pop.getBoundingClientRect();
      const x = clamp(a.left, 10, innerWidth - r.width - 10);
      let y = a.bottom + 6;
      if (y + r.height > innerHeight - 10) y = Math.max(10, a.top - r.height - 6);
      pop.style.left = x + "px";
      pop.style.top = y + "px";
      setTimeout(() => document.addEventListener("pointerdown", outside, true));
      pop.querySelector(".swb.on, .swb")?.focus();
    });
  }

  function openMenu(x, y, items) {
    closeCtxMenu();
    menuEl = document.createElement("div");
    menuEl.className = "ctx";
    menuEl.setAttribute("role", "menu");
    for (const it of items) {
      if (it === "-") {
        menuEl.insertAdjacentHTML("beforeend", '<span class="ctx-sep"></span>');
        continue;
      }
      const b = document.createElement("button");
      b.setAttribute("role", "menuitem");
      b.disabled = !!it.disabled;
      b.innerHTML = icon(it.icon) + `<span>${it.label}</span>` + (it.keys ? `<kbd>${it.keys}</kbd>` : "");
      b.addEventListener("click", () => {
        closeCtxMenu();
        it.run();
      });
      menuEl.append(b);
    }
    document.body.append(menuEl);
    const r = menuEl.getBoundingClientRect();
    menuEl.style.left = Math.min(x, innerWidth - r.width - 8) + "px";
    menuEl.style.top = Math.min(y, innerHeight - r.height - 8) + "px";
  }
  function closeCtxMenu() {
    menuEl?.remove();
    menuEl = null;
  }
  document.addEventListener("pointerdown", (e) => {
    if (menuEl && !menuEl.contains(e.target)) closeCtxMenu();
  });
  function selectionMenu(e) {
    const any = hasSel() || !!floating;
    openMenu(e.clientX, e.clientY, [
      { label: "Cut", icon: "scissors", keys: "Ctrl X", disabled: !any, run: cutSel },
      { label: "Copy", icon: "copy", keys: "Ctrl C", disabled: !any, run: copySel },
      { label: "Paste", icon: "paste", keys: "Ctrl V", run: pasteClip },
      { label: "Delete", icon: "trash", keys: "Del", disabled: !any, run: () => deleteSel() },
      "-",
      { label: "Save as a sprite", icon: "star", keys: "Ctrl E", disabled: !any, run: saveSelectionAsSprite },
      { label: "Fill with main colour", icon: "bucket", disabled: !hasSel(), run: fillSel },
      { label: "Flip sideways", icon: "flipH", keys: "H", disabled: !any, run: () => transformSelection("flipH") },
      { label: "Flip upside down", icon: "flipV", keys: "V", disabled: !any, run: () => transformSelection("flipV") },
      { label: "Turn right", icon: "rotate", keys: "]", disabled: !any, run: () => transformSelection("rotR") },
      "-",
      { label: "Select everything", icon: "select", keys: "Ctrl A", run: selectAll },
      { label: "Swap selected and unselected", icon: "swap", keys: "Ctrl Shift I", run: invertSel },
      { label: "Select nothing", icon: "x", keys: "Ctrl D", disabled: !any, run: deselect },
    ]);
  }

  /* =====================================================================
     SPRITES: saved pieces (a tree, a heart…) you can place again and again
     ===================================================================== */

  const SPRITES_KEY = "icoa-studio:sprites";
  const STARTERS = [
    { name: "Heart", tag: "Shapes", map: ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"], c: { 1: "#d0213c" } },
    { name: "Star", tag: "Shapes", map: ["0001000", "0011100", "1111111", "0111110", "0011100", "0110110", "0100010"], c: { 1: "#e8a82a" } },
    { name: "Tree", tag: "Nature", map: ["0001000", "0011100", "0111110", "0011100", "0111110", "1111111", "0002000", "0002000"], c: { 1: "#2f8f43", 2: "#8a5a35" } },
    { name: "Flower", tag: "Nature", map: ["0011100", "0111110", "1112111", "1122211", "1112111", "0111110", "0011100"], c: { 1: "#ef8fb0", 2: "#f2c230" } },
    { name: "Strawberry", tag: "Fruit", map: ["0020200", "0222220", "1111111", "1141411", "1111111", "0141410", "0011100", "0001000"], c: { 1: "#d0213c", 2: "#2f8f43", 4: "#f3e3bf" } },
    { name: "Diamond", tag: "Shapes", map: ["0001000", "0012100", "0122210", "1223221", "0122210", "0012100", "0001000"], c: { 1: "#2e7c79", 2: "#e8a82a", 3: "#c65a42" } },
    { name: "Moon", tag: "Night", map: ["001110", "011000", "110000", "110000", "110000", "011000", "001110"], c: { 1: "#f2d64a" } },
  ];

  function starterSprites() {
    const now = new Date().toISOString();
    return STARTERS.map((s) => ({
      id: "starter-" + s.name.toLowerCase(),
      name: s.name,
      tag: s.tag,
      fav: false,
      w: s.map[0].length,
      h: s.map.length,
      cells: s.map.join("").split("").map((d) => (d === "0" ? null : s.c[d])),
      created: now,
      updated: now,
    }));
  }
  function loadSprites() {
    const saved = store.get(SPRITES_KEY, null);
    S.sprites = Array.isArray(saved) ? saved : starterSprites();
    if (!Array.isArray(saved)) saveSprites();
  }
  function saveSprites() {
    if (!store.set(SPRITES_KEY, S.sprites)) toast("Couldn't save sprites: storage is full. Export some to a file.");
    renderDock();
  }
  const spriteById = (id) => S.sprites.find((s) => s.id === id);

  /** Picture of a piece made of real-looking beads (cached). */
  const thumbCache = new Map();
  function pieceCanvas(p, cell) {
    const ch = Math.round(cell * 0.7);
    const c = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.max(1, Math.round(p.w * cell * dpr));
    c.height = Math.max(1, Math.round(p.h * ch * dpr));
    const g = c.getContext("2d");
    g.scale(dpr, dpr);
    const sw = (cell * 1.03) / (2 / 2.2);
    p.cells.forEach((hex, i) => {
      if (hex == null) return;
      const x = (i % p.w) * cell + cell / 2;
      const y = Math.floor(i / p.w) * ch + ch / 2;
      g.drawImage(beadImg(hex, finishOf(hex), sw * dpr), x - sw / 2, y - sw / 2, sw, sw);
    });
    return c;
  }
  function spriteThumb(sp) {
    const key = sp.id + sp.updated + sp.w + "x" + sp.h;
    let url = thumbCache.get(key);
    if (!url) {
      const cell = clamp(Math.floor(Math.min(96 / sp.w, 88 / (sp.h * 0.7))), 4, 16);
      url = pieceCanvas(sp, cell).toDataURL("image/png");
      thumbCache.set(key, url);
    }
    return url;
  }

  async function saveSelectionAsSprite() {
    const p = selectionPiece();
    if (!p || !p.cells.some((v) => v != null)) return toast("Select the beads you want to keep as a sprite first.");
    const name = await askName("", "Save as a sprite", "Give it a name, like Tree or Heart.");
    if (!name) return;
    const now = new Date().toISOString();
    const sp = { id: uid(), name, tag: "My sprites", fav: false, ...p, created: now, updated: now };
    S.sprites.unshift(sp);
    S.dockOpen = true;
    saveSprites();
    toast(`Saved "${name}". Click it in Sprites to place it.`);
  }

  /* ---------------- placing a sprite ---------------- */

  function startPlacing(sp) {
    commitFloating();
    sel = null;
    place = { id: sp.id, name: sp.name, w: sp.w, h: sp.h, cells: sp.cells.slice() };
    setTool("place", true);
    selChanged();
    renderDock();
  }
  function placeAt(at) {
    if (!place) return;
    const x = at.c - Math.floor(place.w / 2);
    const y = at.r - Math.floor(place.h / 2);
    edit(() => stampPiece(place, x, y));
  }
  function stampPiece(p, x, y) {
    p.cells.forEach((v, i) => {
      const r = y + Math.floor(i / p.w);
      const c = x + (i % p.w);
      if (v != null && inside(r, c)) S.cells[idx(r, c)] = v;
    });
  }
  function fillBand(gap) {
    if (!place) return;
    const n = Math.max(1, Math.floor((S.cols + gap) / (place.w + gap)));
    const total = n * place.w + (n - 1) * gap;
    const start = Math.floor((S.cols - total) / 2);
    const y = hover ? hover.r - Math.floor(place.h / 2) : Math.floor((S.rows - place.h) / 2);
    edit(() => {
      for (let k = 0; k < n; k++) stampPiece(place, start + k * (place.w + gap), y);
    });
    toast(`Placed ${n} along the band.`, true);
  }
  function stopPlacing() {
    place = null;
    if (S.tool === "place") setTool(S.lastTool && S.lastTool !== "place" ? S.lastTool : "pencil");
    renderDock();
  }

  /* ---------------- what's drawn on top of the beads ---------------- */

  /** Beads to show over the pattern: the floating piece, or the sprite following the cursor. */
  function overlayCells() {
    const map = new Map();
    const add = (p, x, y) =>
      p.cells.forEach((v, i) => {
        const r = y + Math.floor(i / p.w);
        const c = x + (i % p.w);
        if (v != null && inside(r, c)) map.set(idx(r, c), v);
      });
    if (floating) add(floating, floating.x, floating.y);
    if (place && hover && S.tool === "place") add(place, hover.c - Math.floor(place.w / 2), hover.r - Math.floor(place.h / 2));
    return map.size ? map : null;
  }

  function drawSelectionLayer(L) {
    const { cw, ch, x0, y0 } = L;
    ctx.save();
    const antsStroke = () => {
      ctx.lineWidth = 1.6;
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.stroke();
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -antsOffset;
      ctx.strokeStyle = "#1f130e";
      ctx.stroke();
    };
    // the selection outline
    if (sel) {
      ctx.fillStyle = "rgba(46,124,121,0.10)";
      ctx.beginPath();
      for (let r = 0; r < S.rows; r++)
        for (let c = 0; c < S.cols; c++) {
          if (!sel[idx(r, c)]) continue;
          const x = x0 + c * cw;
          const y = y0 + r * ch;
          ctx.rect(x, y, cw, ch);
          if (r === 0 || !sel[idx(r - 1, c)]) (ctx.moveTo(x, y), ctx.lineTo(x + cw, y));
          if (r === S.rows - 1 || !sel[idx(r + 1, c)]) (ctx.moveTo(x, y + ch), ctx.lineTo(x + cw, y + ch));
          if (c === 0 || !sel[idx(r, c - 1)]) (ctx.moveTo(x, y), ctx.lineTo(x, y + ch));
          if (c === S.cols - 1 || !sel[idx(r, c + 1)]) (ctx.moveTo(x + cw, y), ctx.lineTo(x + cw, y + ch));
        }
      ctx.fill();
      // redraw only the edges for the ants
      ctx.beginPath();
      for (let r = 0; r < S.rows; r++)
        for (let c = 0; c < S.cols; c++) {
          if (!sel[idx(r, c)]) continue;
          const x = Math.round(x0 + c * cw) + 0.5;
          const y = Math.round(y0 + r * ch) + 0.5;
          const x2 = Math.round(x0 + (c + 1) * cw) + 0.5;
          const y2 = Math.round(y0 + (r + 1) * ch) + 0.5;
          if (r === 0 || !sel[idx(r - 1, c)]) (ctx.moveTo(x, y), ctx.lineTo(x2, y));
          if (r === S.rows - 1 || !sel[idx(r + 1, c)]) (ctx.moveTo(x, y2), ctx.lineTo(x2, y2));
          if (c === 0 || !sel[idx(r, c - 1)]) (ctx.moveTo(x, y), ctx.lineTo(x, y2));
          if (c === S.cols - 1 || !sel[idx(r, c + 1)]) (ctx.moveTo(x2, y), ctx.lineTo(x2, y2));
        }
      antsStroke();
    }
    // the floating piece's box
    if (floating) {
      ctx.beginPath();
      ctx.rect(Math.round(x0 + floating.x * cw) + 0.5, Math.round(y0 + floating.y * ch) + 0.5, floating.w * cw, floating.h * ch);
      ctx.shadowColor = "rgba(31,19,14,0.25)";
      antsStroke();
    }
    // the sprite following the cursor
    if (place && hover && S.tool === "place") {
      const x = x0 + (hover.c - Math.floor(place.w / 2)) * cw;
      const y = y0 + (hover.r - Math.floor(place.h / 2)) * ch;
      ctx.beginPath();
      ctx.rect(Math.round(x) + 0.5, Math.round(y) + 0.5, place.w * cw, place.h * ch);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(46,124,121,0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // a selection being drawn
    if (drag && drag.tool === "select" && drag.last) {
      const r0 = Math.min(drag.start.r, drag.last.r);
      const c0 = Math.min(drag.start.c, drag.last.c);
      const r1 = Math.max(drag.start.r, drag.last.r);
      const c1 = Math.max(drag.start.c, drag.last.c);
      ctx.beginPath();
      ctx.rect(Math.round(x0 + c0 * cw) + 0.5, Math.round(y0 + r0 * ch) + 0.5, (c1 - c0 + 1) * cw, (r1 - r0 + 1) * ch);
      ctx.fillStyle = drag.mode === "sub" ? "rgba(198,90,66,0.12)" : "rgba(46,124,121,0.12)";
      ctx.fill();
      antsStroke();
    }
    if (drag && drag.tool === "lasso" && drag.pts.length > 1) {
      ctx.beginPath();
      drag.pts.forEach((p, i) => (i ? ctx.lineTo(x0 + p.x * cw, y0 + p.y * ch) : ctx.moveTo(x0 + p.x * cw, y0 + p.y * ch)));
      antsStroke();
    }
    ctx.restore();
  }

  /* ---------------- sprites dock ---------------- */

  function renderDock() {
    const dock = $("#dock");
    if (!dock) return;
    dock.classList.toggle("closed", !S.dockOpen);
    $("#dockCount").textContent = S.sprites.length;
    // tag chips
    const tags = [...new Set(S.sprites.map((s) => s.tag).filter(Boolean))].sort();
    const chips = [["all", "All"], ["fav", "♥ Favourites"], ...tags.map((t) => [t, t])];
    if (!chips.some(([v]) => v === S.spriteTag)) S.spriteTag = "all";
    $("#spriteTags").innerHTML = "";
    for (const [v, l] of chips) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip-tag";
      b.textContent = l;
      b.setAttribute("aria-pressed", String(S.spriteTag === v));
      b.addEventListener("click", () => {
        S.spriteTag = v;
        renderDock();
      });
      $("#spriteTags").append(b);
    }
    const q = (S.spriteQuery || "").toLowerCase();
    const list = S.sprites
      .filter((s) => (S.spriteTag === "all" ? true : S.spriteTag === "fav" ? s.fav : s.tag === S.spriteTag))
      .filter((s) => !q || `${s.name} ${s.tag}`.toLowerCase().includes(q))
      .sort((a, b) => Number(!!b.fav) - Number(!!a.fav));
    const box = $("#spriteList");
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML = `<p class="empty dock-empty">${S.sprites.length ? "No sprites match." : "Select some beads and press Ctrl E (or “Save as a sprite”) to keep them here."}</p>`;
      return;
    }
    for (const sp of list) {
      const card = document.createElement("div");
      card.className = "spr" + (place && place.id === sp.id ? " on" : "");
      card.draggable = true;
      card.title = `${sp.name}: click to place, or drag onto the pattern`;
      card.innerHTML = `<button class="spr-img" aria-label="Place ${escapeHtml(sp.name)}"><img alt="" src="${spriteThumb(sp)}"></button>
        <span class="spr-name">${escapeHtml(sp.name)}</span><span class="spr-size">${sp.w} × ${sp.h}</span>
        <span class="spr-acts">
          <button class="fav${sp.fav ? " is" : ""}" aria-label="Favourite" title="Favourite">${icon("heart")}</button>
          <button class="cust" aria-label="Customise ${escapeHtml(sp.name)}" title="Customise">${icon("sliders")}</button>
        </span>`;
      card.querySelector(".spr-img").addEventListener("click", () => (place && place.id === sp.id ? stopPlacing() : startPlacing(sp)));
      card.querySelector(".fav").addEventListener("click", () => {
        sp.fav = !sp.fav;
        saveSprites();
      });
      card.querySelector(".cust").addEventListener("click", () => openSpriteEditor(sp.id));
      card.addEventListener("dragstart", (e) => {
        $("#stage").dataset.dragSprite = sp.id;
        e.dataTransfer.setData("text/icoa-sprite", sp.id);
        e.dataTransfer.effectAllowed = "copy";
      });
      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, [
          { label: "Place it", icon: "stamp", run: () => startPlacing(sp) },
          { label: "Customise", icon: "sliders", run: () => openSpriteEditor(sp.id) },
          { label: "Make a copy", icon: "copy", run: () => duplicateSprite(sp.id) },
          { label: "Copy to paste", icon: "paste", run: () => ((clip = { w: sp.w, h: sp.h, cells: sp.cells.slice() }), toast("Copied. Ctrl V pastes it.")) },
          "-",
          { label: "Delete", icon: "trash", run: () => deleteSprite(sp.id) },
        ]);
      });
      box.append(card);
    }
  }
  function duplicateSprite(id) {
    const sp = spriteById(id);
    if (!sp) return;
    const now = new Date().toISOString();
    const copy = { ...structuredClone(sp), id: uid(), name: sp.name + " copy", created: now, updated: now };
    S.sprites.splice(S.sprites.indexOf(sp) + 1, 0, copy);
    saveSprites();
    return copy;
  }
  async function deleteSprite(id) {
    const sp = spriteById(id);
    if (!sp || !(await confirmBox(`Delete "${sp.name}"?`, "It's removed from your sprites. Patterns that already use it keep their beads.", "Delete"))) return false;
    S.sprites = S.sprites.filter((s) => s.id !== id);
    if (place && place.id === id) stopPlacing();
    saveSprites();
    return true;
  }

  /* ---------------- customising a sprite ---------------- */

  let editing = null; // { id, original }
  function openSpriteEditor(id) {
    const sp = spriteById(id);
    if (!sp) return;
    editing = { id, original: structuredClone(sp) };
    renderSpriteEditor();
    $("#dlgSprite").showModal();
  }
  function updateEditing(change) {
    const sp = spriteById(editing.id);
    change(sp);
    sp.updated = new Date().toISOString();
    if (place && place.id === sp.id) place = { id: sp.id, name: sp.name, w: sp.w, h: sp.h, cells: sp.cells.slice() };
    saveSprites();
    renderSpriteEditor();
  }
  function renderSpriteEditor() {
    const sp = spriteById(editing?.id);
    if (!sp) return;
    $("#spName").value = sp.name;
    $("#spTag").value = sp.tag || "";
    $("#spTags").innerHTML = [...new Set(S.sprites.map((s) => s.tag).filter(Boolean))].map((t) => `<option value="${escapeHtml(t)}">`).join("");
    $("#spFav").checked = !!sp.fav;
    $("#spSize").textContent = `${sp.w} beads wide × ${sp.h} rows (${sp.cells.filter((v) => v != null).length} beads)`;
    const cell = clamp(Math.floor(Math.min(320 / sp.w, 240 / (sp.h * 0.7))), 6, 34);
    const prev = $("#spPreview");
    prev.innerHTML = "";
    prev.append(pieceCanvas(sp, cell));
    prev.lastChild.style.width = sp.w * cell + "px";

    // colours in the sprite
    const counts = new Map();
    sp.cells.forEach((v) => v != null && counts.set(v, (counts.get(v) || 0) + 1));
    const ul = $("#spColours");
    ul.innerHTML = "";
    for (const [hex, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="sw-dot" style="background:${hex}"></span>
        <span class="meta"><b>${escapeHtml(nameOf(hex))}</b><code>${hex.toUpperCase()}</code></span><span class="count">${n}</span>`;
      const to = document.createElement("button");
      to.className = "mini";
      to.innerHTML = icon("palette") + "<span>Change colour</span>";
      to.title = `Pick a new colour for the ${nameOf(hex)} beads`;
      to.addEventListener("click", async () => {
        const next = await pickColour(to, hex);
        if (next && next !== hex) updateEditing((s) => Object.assign(s, PIECE.recolour(s, hex, next)));
      });
      const clear = document.createElement("button");
      clear.className = "mini";
      clear.textContent = "See-through";
      clear.title = "Remove these beads so the pattern shows through";
      clear.addEventListener("click", () => {
        if (counts.size === 1) return toast("A sprite needs at least one colour.");
        updateEditing((s) => Object.assign(s, trimPiece(PIECE.recolour(s, hex, null))));
      });
      li.append(to, clear);
      ul.append(li);
    }
  }
  function spriteEditorWiring() {
    const on = (sel, fn) => $(sel).addEventListener("click", fn);
    $("#spName").addEventListener("change", (e) => updateEditing((s) => (s.name = e.target.value.trim() || s.name)));
    $("#spTag").addEventListener("change", (e) => updateEditing((s) => (s.tag = e.target.value.trim())));
    $("#spFav").addEventListener("change", (e) => updateEditing((s) => (s.fav = e.target.checked)));
    for (const [id, op] of [
      ["#spFlipH", "flipH"],
      ["#spFlipV", "flipV"],
      ["#spRotL", "rotL"],
      ["#spRotR", "rotR"],
    ])
      on(id, () => updateEditing((s) => Object.assign(s, PIECE[op](s))));
    on("#spDouble", () => {
      const sp = spriteById(editing.id);
      if (sp.w * 2 > S.cols || sp.h * 2 > 40) return toast("That would be bigger than the band.");
      updateEditing((s) => Object.assign(s, PIECE.double(s)));
    });
    on("#spOutline", async () => {
      const hex = await pickColour($("#spOutline"), S.primary, "Outline colour");
      if (hex) updateEditing((s) => Object.assign(s, PIECE.outline(s, hex)));
    });
    on("#spTrim", () => updateEditing((s) => Object.assign(s, trimPiece(s))));
    on("#spFromSel", () => {
      const p = selectionPiece();
      if (!p) return toast("Close this, select beads in the pattern, then come back.");
      updateEditing((s) => Object.assign(s, p));
      toast("Replaced with the selected beads.");
    });
    on("#spRevert", () => {
      const o = editing.original;
      updateEditing((s) => Object.assign(s, structuredClone(o)));
    });
    on("#spCopy", () => {
      const c = duplicateSprite(editing.id);
      if (c) openSpriteEditor(c.id);
    });
    on("#spDelete", async () => {
      $("#dlgSprite").close();
      await deleteSprite(editing.id);
    });
    on("#spPlace", () => {
      $("#dlgSprite").close();
      startPlacing(spriteById(editing.id));
    });
    on("#spExport", () => exportSprites([spriteById(editing.id)]));
  }

  /* ---------------- sharing sprites ---------------- */

  function exportSprites(list) {
    const data = { app: "icoa-uru-sprites", version: 1, sprites: list.map(({ id, name, tag, w, h, cells }) => ({ id, name, tag, w, h, cells })) };
    const name = list.length === 1 ? list[0].name : "Icoa-Uru sprites";
    saveText(name.replace(/[^\w\- ]+/g, "") + ".icoa-sprites.json", JSON.stringify(data), "sprites").then((ok) => ok && toast(`Saved ${list.length} sprite${list.length === 1 ? "" : "s"} to a file.`));
  }
  function importSpritesText(text) {
    try {
      const d = JSON.parse(text);
      const list = Array.isArray(d.sprites) ? d.sprites : [];
      const now = new Date().toISOString();
      let n = 0;
      for (const s of list) {
        if (!s || !s.w || !s.h || !Array.isArray(s.cells)) continue;
        const cells = s.cells.slice(0, s.w * s.h).map((v) => (v == null ? null : norm(v)));
        S.sprites.push({ id: uid(), name: String(s.name || "Sprite").slice(0, 60), tag: String(s.tag || "Imported").slice(0, 40), fav: false, w: s.w | 0, h: s.h | 0, cells, created: now, updated: now });
        n++;
      }
      if (!n) throw new Error("none");
      S.dockOpen = true;
      saveSprites();
      toast(`Added ${n} sprite${n === 1 ? "" : "s"}.`);
    } catch (e) {
      toast("That file doesn't have any sprites in it.");
    }
  }

  /* =====================================================================
     FILES: native dialogs in the app, browser downloads otherwise
     ===================================================================== */

  const NATIVE = window.studioApp || null;
  /** Saves text to a file. Returns true when saved. */
  async function saveText(name, text, kind) {
    if (NATIVE) {
      const r = await NATIVE.saveFile({ name, text, kind });
      return !!(r && r.saved);
    }
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: "Icoa-Uru file", accept: { "application/json": [".json"] } }] });
        const w = await h.createWritable();
        await w.write(text);
        await w.close();
        return true;
      } catch (e) {
        if (e && e.name === "AbortError") return false;
      }
    }
    download(new Blob([text], { type: "application/json" }), name);
    return true;
  }
  async function saveBlob(name, blob, kind) {
    if (NATIVE) {
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      const r = await NATIVE.saveFile({ name, base64: btoa(bin), kind });
      return !!(r && r.saved);
    }
    download(blob, name);
    return true;
  }
  /** Asks for a file. kind: "pattern" | "sprites" | "backup" | "image". Returns { name, text } or { name, dataUrl }. */
  function pickFile(kind) {
    if (NATIVE) return NATIVE.openFile({ kind });
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = kind === "image" ? "image/*" : ".json,application/json";
      input.addEventListener("change", async () => {
        const f = input.files[0];
        if (!f) return resolve(null);
        if (kind === "image") resolve({ name: f.name, dataUrl: URL.createObjectURL(f) });
        else resolve({ name: f.name, text: await f.text() });
      });
      input.click();
    });
  }

  /* back up everything (patterns, sprites, my colours) to one file */
  async function backupAll() {
    const data = { app: "icoa-uru-studio-backup", version: 1, savedAt: new Date().toISOString(), patterns: library(), sprites: S.sprites, colours: S.custom, current: serialize() };
    const ok = await saveText(`Pattern Studio backup ${new Date().toISOString().slice(0, 10)}.icoa-backup.json`, JSON.stringify(data), "backup");
    if (ok) toast(`Backed up ${data.patterns.length} patterns and ${data.sprites.length} sprites.`);
  }
  async function restoreBackup() {
    const f = await pickFile("backup");
    if (!f || !f.text) return;
    try {
      const d = JSON.parse(f.text);
      if (d.app !== "icoa-uru-studio-backup") throw new Error("not a backup");
      const lib = library();
      let p = 0;
      for (const x of d.patterns || []) if (!lib.some((y) => y.id === x.id)) (lib.push(x), p++);
      store.set(KEY.lib, lib);
      let s = 0;
      for (const x of d.sprites || []) if (!S.sprites.some((y) => y.id === x.id)) (S.sprites.push(x), s++);
      for (const c of d.colours || []) if (!S.custom.some((y) => y.hex === c.hex)) S.custom.push(c);
      store.set(KEY.custom, S.custom);
      saveSprites();
      renderPalettes();
      toast(`Added ${p} patterns and ${s} sprites from the backup.`);
    } catch (e) {
      toast("That isn't a Pattern Studio backup file.");
    }
  }

  /* ---------------- after every change ---------------- */
  let autosaveTimer = 0;
  /** @param resized the grid size changed  @param live in the middle of a stroke */
  function changed(resized, live) {
    redraw();
    if (live) return;
    renderUsed();
    renderSize();
    updateHistoryButtons();
    markSaved();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autosave, 350);
  }
  function autosave() {
    store.set(KEY.cur, { ...serialize(), id: S.id, savedSig: S.savedSig, primary: S.primary, secondary: S.secondary, bg: S.bg });
  }
  function updateHistoryButtons() {
    $("#undo").disabled = !past.length;
    $("#redo").disabled = !future.length;
  }
  function markSaved() {
    document.title = `${S.name} - Icoa-Uru Pattern Studio`;
    const el = $("#saved");
    if (!S.id) el.textContent = "Not saved yet";
    else el.textContent = sig() === S.savedSig ? "Saved" : "Changed since saving";
  }

  /* ---------------- tools bar + options ---------------- */
  function renderTools() {
    const nav = $("#tools");
    nav.innerHTML = "";
    TOOLS.forEach((t) => {
      if (t.hidden) return;
      if (t.id === "pencil" || t.id === "line") nav.insertAdjacentHTML("beforeend", '<span class="sep"></span>');
      const b = document.createElement("button");
      b.className = "tool";
      b.dataset.tool = t.id;
      b.setAttribute("aria-label", `${t.name} (${t.key})`);
      b.setAttribute("aria-pressed", String(S.tool === t.id));
      b.innerHTML = icon(t.icon) + `<span class="tip">${t.name}<kbd>${t.key}</kbd></span>`;
      b.addEventListener("click", () => setTool(t.id));
      nav.append(b);
    });
  }
  function setTool(id, keep) {
    if (!keep && floating && !(selTools.includes(id) && selTools.includes(S.tool))) commitFloating();
    if (id !== "place" && place) {
      place = null;
      renderDock();
    }
    if (S.tool !== "picker" && S.tool !== "place") S.lastTool = S.tool;
    S.tool = id;
    $$(".tool").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === id)));
    cv.style.cursor = id === "picker" ? "copy" : id === "text" ? "text" : id === "place" ? "copy" : selTools.includes(id) ? "cell" : "crosshair";
    renderOptions();
    redraw();
  }
  function seg(name, options, value, onPick) {
    const wrap = document.createElement("span");
    wrap.className = "seg";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", name);
    for (const [v, label, ic] of options) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = (ic ? icon(ic) : "") + label;
      b.setAttribute("aria-pressed", String(v === value));
      b.addEventListener("click", () => {
        onPick(v);
        renderOptions();
        redraw();
      });
      wrap.append(b);
    }
    return wrap;
  }
  function label(text) {
    const s = document.createElement("span");
    s.className = "label";
    s.textContent = text;
    return s;
  }
  function renderOptions() {
    const box = $("#opts");
    const t = TOOLS.find((x) => x.id === S.tool);
    box.innerHTML = `<span class="tool-name">${t.name}</span>`;
    if (S.tool === "pencil" || S.tool === "eraser") {
      box.append(
        label("Size"),
        seg(
          "Brush size",
          [
            [1, "1"],
            [2, "2"],
            [3, "3"],
          ],
          S.brush,
          (v) => (S.brush = v)
        )
      );
    }
    if (["pencil", "eraser", "fill", "line", "rect"].includes(S.tool)) {
      box.append(
        label("Mirror"),
        seg(
          "Mirror while painting",
          [
            ["off", "Off"],
            ["h", "Sideways"],
            ["v", "Up and down"],
            ["both", "Both"],
          ],
          S.mirror,
          (v) => (S.mirror = v)
        )
      );
    }
    if (S.tool === "rect") {
      box.append(
        seg(
          "Rectangle style",
          [
            [false, "Outline"],
            [true, "Filled"],
          ],
          S.rectFill,
          (v) => (S.rectFill = v)
        )
      );
    }
    if (selTools.includes(S.tool)) {
      box.append(
        seg(
          "Selection mode",
          [
            ["new", "New"],
            ["add", "Add"],
            ["sub", "Take away"],
          ],
          S.selMode,
          (v) => (S.selMode = v)
        )
      );
      if (S.tool === "wand")
        box.append(
          seg(
            "Magic wand picks",
            [
              [false, "Touching"],
              [true, "Everywhere"],
            ],
            S.wandAll,
            (v) => (S.wandAll = v)
          )
        );
      const t = document.createElement("label");
      t.className = "toggle opt-toggle";
      t.title = "When copying or saving a sprite, beads in the background colour are left out, so only the shape is pasted";
      t.innerHTML = `<input type="checkbox" ${S.skipBg ? "checked" : ""}> Leave out background`;
      t.querySelector("input").addEventListener("change", (e) => (S.skipBg = e.target.checked));
      box.append(t);
      const any = hasSel() || !!floating;
      const acts = document.createElement("span");
      acts.className = "acts";
      const act = (ic, text, fn, title, disabled, cls) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mini" + (cls ? " " + cls : "");
        b.innerHTML = icon(ic) + `<span>${text}</span>`;
        b.title = title;
        b.disabled = !!disabled;
        b.addEventListener("click", fn);
        acts.append(b);
      };
      if (floating) {
        act("check", "Done", () => commitFloating(), "Put it down (Enter)", false, "solid");
        act("x", floating.origin === "paste" ? "Cancel" : "Put back", () => cancelFloating(), "Esc", false);
      }
      act("copy", "Copy", copySel, "Ctrl C", !any);
      act("scissors", "Cut", cutSel, "Ctrl X", !any);
      act("paste", "Paste", pasteClip, "Ctrl V", false);
      act("trash", "Delete", () => deleteSel(), "Del", !any);
      act("flipH", "", () => transformSelection("flipH"), "Flip sideways (H)", !any);
      act("flipV", "", () => transformSelection("flipV"), "Flip upside down (V)", !any);
      act("rotate", "", () => transformSelection("rotR"), "Turn right ( ] )", !any);
      act("star", "Save as sprite", saveSelectionAsSprite, "Ctrl E", !any, "accent");
      box.append(acts);
    }
    if (S.tool === "place" && place) {
      const n = document.createElement("span");
      n.className = "label";
      n.innerHTML = `<b style="color:var(--cocoa)">${escapeHtml(place.name)}</b> ${place.w} × ${place.h}`;
      const acts = document.createElement("span");
      acts.className = "acts";
      const act = (ic, text, fn, title, cls) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mini" + (cls ? " " + cls : "");
        b.innerHTML = icon(ic) + (text ? `<span>${text}</span>` : "");
        b.title = title;
        b.addEventListener("click", fn);
        acts.append(b);
      };
      const tf = (op) => () => {
        place = { ...place, ...PIECE[op](place) };
        renderOptions();
        redraw();
      };
      act("rotateL", "", tf("rotL"), "Turn left ( [ )");
      act("rotate", "", tf("rotR"), "Turn right ( ] )");
      act("flipH", "", tf("flipH"), "Flip sideways (H)");
      act("flipV", "", tf("flipV"), "Flip upside down (V)");
      const gap = document.createElement("label");
      gap.className = "label gap";
      gap.innerHTML = `Gap <input type="number" min="0" max="20" value="${S.repeatGap ?? 2}" aria-label="Gap between repeats">`;
      gap.querySelector("input").addEventListener("change", (e) => (S.repeatGap = clamp(Number(e.target.value) || 0, 0, 20)));
      act("repeat", "Repeat along the band", () => fillBand(S.repeatGap ?? 2), "Places it all along the band, at the height of your cursor (or centred)");
      acts.insertBefore(gap, acts.lastChild);
      act("check", "Done", stopPlacing, "Esc", "solid");
      box.append(n, acts);
    }
    if (S.tool === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.value = S.text;
      input.maxLength = 24;
      input.setAttribute("aria-label", "Letters to weave");
      input.placeholder = "Type a word";
      input.addEventListener("input", () => {
        S.text = input.value;
        redraw();
      });
      box.append(
        input,
        seg(
          "Letter size",
          [
            [1, "Normal"],
            [2, "Big"],
          ],
          S.textScale,
          (v) => (S.textScale = v)
        )
      );
    }
    const hint = document.createElement("span");
    hint.className = "hint hide-md";
    hint.textContent = t.hint;
    box.append(hint);
  }

  /* ---------------- colour panel ---------------- */
  function refreshColour() {
    $("#swPrimary").style.background = S.primary;
    $("#swSecondary").style.background = S.secondary;
    $("#cName").textContent = nameOf(S.primary);
    $("#cFinish").textContent = FINISH_NAMES[finishOf(S.primary)] + (S.primary === S.bg ? ", background" : "");
    if (document.activeElement !== $("#hex")) $("#hex").value = S.primary.toUpperCase();
    const [r, g, b] = rgbOf(S.primary);
    if (document.activeElement !== $("#r")) $("#r").value = r;
    if (document.activeElement !== $("#g")) $("#g").value = g;
    if (document.activeElement !== $("#b")) $("#b").value = b;
    $("#picker").value = S.primary;
    $$(".chip").forEach((ch) => {
      ch.classList.toggle("on", ch.dataset.hex === S.primary);
      ch.classList.toggle("on2", ch.dataset.hex === S.secondary && ch.dataset.hex !== S.primary);
    });
    savePrefs();
  }
  function chip(c, removable) {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.hex = c.hex;
    b.title = `${c.name}  ${c.hex.toUpperCase()}  ${FINISH_NAMES[c.finish]}`;
    b.setAttribute("aria-label", `${c.name}, ${c.hex.toUpperCase()}`);
    b.append(swatchCanvas(c.hex, c.finish, 40));
    b.addEventListener("click", () => {
      S.primary = c.hex;
      if (S.tool === "eraser" || S.tool === "picker") setTool("pencil");
      refreshColour();
    });
    b.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      S.secondary = c.hex;
      refreshColour();
    });
    if (removable) {
      const x = document.createElement("span");
      x.className = "x";
      x.textContent = "×";
      x.title = "Remove from my colours";
      x.addEventListener("click", (e) => {
        e.stopPropagation();
        S.custom = S.custom.filter((k) => k.hex !== c.hex);
        store.set(KEY.custom, S.custom);
        renderPalettes();
        changed(false);
      });
      b.append(x);
    }
    return b;
  }
  function renderPalettes() {
    const p = $("#palette");
    p.innerHTML = "";
    PALETTE.forEach((c) => p.append(chip(c)));
    const m = $("#custom");
    m.innerHTML = "";
    S.custom.forEach((c) => m.append(chip(c, true)));
    $("#customEmpty").hidden = S.custom.length > 0;
    refreshColour();
  }
  function setPrimaryHex(hex) {
    const h = norm(hex);
    if (!h) return false;
    S.primary = h;
    refreshColour();
    return true;
  }
  $("#hex").addEventListener("input", (e) => setPrimaryHex(e.target.value));
  $("#hex").addEventListener("blur", refreshColour);
  for (const id of ["r", "g", "b"])
    $("#" + id).addEventListener("input", () => {
      const v = ["r", "g", "b"].map((k) => clamp(Number($("#" + k).value) || 0, 0, 255));
      setPrimaryHex(toHex(v[0], v[1], v[2]));
    });
  $("#picker").addEventListener("input", (e) => setPrimaryHex(e.target.value));
  $("#copyHex").addEventListener("click", () => copyText(S.primary.toUpperCase()));
  $("#swap").addEventListener("click", swapColours);
  $("#swPrimary").addEventListener("click", () => $("#picker").click());
  $("#swSecondary").addEventListener("click", swapColours);
  $("#addColour").addEventListener("click", () => {
    const hex = S.primary;
    const finish = $("#newFinish").value;
    const existing = PALETTE.find((c) => c.hex === hex);
    if (existing && existing.finish === finish) return toast(`${existing.name} is already in the Miyuki colours.`);
    const name = "My " + hex.toUpperCase();
    S.custom = [...S.custom.filter((c) => c.hex !== hex), { name, hex, finish }];
    store.set(KEY.custom, S.custom);
    renderPalettes();
    changed(false);
    toast(`Added ${hex.toUpperCase()} to my colours.`);
  });
  function swapColours() {
    const t = S.primary;
    S.primary = S.secondary;
    S.secondary = t;
    refreshColour();
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.append(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    toast(`Copied ${text}`);
  }

  /* ---------------- colours in this pattern ---------------- */
  function renderUsed() {
    const counts = new Map();
    S.cells.forEach((h) => counts.set(h, (counts.get(h) || 0) + 1));
    const list = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const ul = $("#used");
    ul.innerHTML = "";
    for (const [hex, n] of list) {
      const li = document.createElement("li");
      const sw = document.createElement("button");
      sw.className = "sw";
      sw.title = "Paint with this colour";
      sw.setAttribute("aria-label", `Paint with ${nameOf(hex)}`);
      sw.append(swatchCanvas(hex, finishOf(hex), 40));
      sw.addEventListener("click", () => {
        S.primary = hex;
        refreshColour();
      });
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `<b>${escapeHtml(nameOf(hex))}${hex === S.bg ? " <span style='color:var(--muted);font-weight:400'>(background)</span>" : ""}</b>`;
      const hx = document.createElement("button");
      hx.textContent = hex;
      hx.title = "Copy the hex code";
      hx.addEventListener("click", () => copyText(hex.toUpperCase()));
      meta.append(hx);
      const acts = document.createElement("div");
      acts.className = "acts";
      acts.innerHTML = `<span class="count">${n}</span>`;
      const rep = document.createElement("button");
      rep.innerHTML = icon("replace");
      rep.title = `Change every ${said(hex)} bead to the main colour`;
      rep.setAttribute("aria-label", rep.title);
      rep.addEventListener("click", () => {
        if (hex === S.primary) return toast("Pick a different main colour first.");
        edit(() => (S.cells = S.cells.map((v) => (v === hex ? S.primary : v))));
      });
      const clr = document.createElement("button");
      clr.innerHTML = icon("eraser");
      clr.title = `Clear every ${said(hex)} bead (back to background)`;
      clr.setAttribute("aria-label", clr.title);
      clr.addEventListener("click", () => {
        if (hex === S.bg) return toast("That's the background colour already.");
        edit(() => (S.cells = S.cells.map((v) => (v === hex ? S.bg : v))));
        toast(`Cleared ${n} ${said(hex)} beads.`, true);
      });
      acts.append(rep, clr);
      li.append(sw, meta, acts);
      li.addEventListener("mouseenter", () => {
        S.highlight = hex;
        redraw();
      });
      li.addEventListener("mouseleave", () => {
        S.highlight = null;
        redraw();
      });
      ul.append(li);
    }
    $("#usedHelp").textContent = list.length + (list.length === 1 ? " colour." : " colours.");
  }

  /* ---------------- size ---------------- */
  function renderSize() {
    const box = $("#sizes");
    if (!box.children.length) {
      SIZES.forEach((s) => {
        const b = document.createElement("button");
        b.dataset.rows = s.rows;
        b.innerHTML = `${s.label}<span>${s.rows}</span>`;
        b.setAttribute("aria-label", `${s.label}, ${s.rows} rows`);
        b.addEventListener("click", () => resize(s.rows, S.cols));
        box.append(b);
      });
    }
    [...box.children].forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.rows) === S.rows)));
    if (document.activeElement !== $("#rows")) $("#rows").value = S.rows;
    if (document.activeElement !== $("#cols")) $("#cols").value = S.cols;
    $("#fBeads").textContent = (S.rows * S.cols).toLocaleString();
    $("#fSize").textContent = `${((S.cols * BEAD_MM) / 10).toFixed(1)} × ${((S.rows * ROW_MM) / 10).toFixed(1)} cm`;
  }
  /** Rows stay centred; length grows or shrinks at the end. */
  function resize(rows, cols) {
    commitFloating(false);
    sel = null;
    rows = clamp(Math.round(rows) || S.rows, 3, 40);
    cols = clamp(Math.round(cols) || S.cols, 10, 200);
    if (rows === S.rows && cols === S.cols) return renderSize();
    edit(() => {
      const next = new Array(rows * cols).fill(S.bg);
      const off = Math.floor((rows - S.rows) / 2);
      for (let r = 0; r < S.rows; r++)
        for (let c = 0; c < Math.min(cols, S.cols); c++) {
          const nr = r + off;
          if (nr >= 0 && nr < rows) next[nr * cols + c] = S.cells[idx(r, c)];
        }
      S.rows = rows;
      S.cols = cols;
      S.cells = next;
    });
  }
  $("#rows").addEventListener("change", (e) => resize(Number(e.target.value), S.cols));
  $("#cols").addEventListener("change", (e) => resize(S.rows, Number(e.target.value)));

  /* ---------------- arrange ---------------- */
  const ARRANGE = {
    flipH: () => edit(() => (S.cells = S.cells.map((_, i) => S.cells[idx(Math.floor(i / S.cols), S.cols - 1 - (i % S.cols))]))),
    flipV: () => edit(() => (S.cells = S.cells.map((_, i) => S.cells[idx(S.rows - 1 - Math.floor(i / S.cols), i % S.cols)]))),
    mirrorLR: () =>
      edit(() => {
        for (let r = 0; r < S.rows; r++) for (let c = 0; c < Math.floor(S.cols / 2); c++) S.cells[idx(r, S.cols - 1 - c)] = S.cells[idx(r, c)];
      }),
    repeat: () => {
      // finds the first block that ends in a background column and repeats it along the band
      let end = 0;
      for (let c = 1; c < S.cols; c++) {
        let blank = true;
        for (let r = 0; r < S.rows; r++) if (S.cells[idx(r, c)] !== S.bg) blank = false;
        if (blank && c > 2) {
          end = c + 1;
          break;
        }
      }
      if (!end || end >= S.cols) return toast("Draw a motif at the start, followed by an empty column, and this repeats it along the band.");
      edit(() => {
        for (let c = end; c < S.cols; c++) for (let r = 0; r < S.rows; r++) S.cells[idx(r, c)] = S.cells[idx(r, c % end)];
      });
      toast(`Repeated the first ${end} beads along the band.`, true);
    },
    fillBg: () => {
      const old = S.bg;
      if (S.primary === old) return toast("Pick a different colour first; that one is already the background.");
      S.bg = S.primary;
      edit(() => (S.cells = S.cells.map((v) => (v === old ? S.bg : v))));
      refreshColour();
      toast(`${nameOf(S.bg)} is now the background. The eraser paints with it.`, true);
    },
    clearAll: async () => {
      if (!(await confirmBox("Clear everything?", "Every bead goes back to the background colour. You can still undo this.", "Clear"))) return;
      edit(() => (S.cells = S.cells.map(() => S.bg)));
    },
  };
  $$("[data-act]").forEach((b) =>
    b.addEventListener("click", () => {
      closeMenu();
      const a = b.dataset.act;
      if (ARRANGE[a]) ARRANGE[a]();
      else if (ACTIONS[a]) ACTIONS[a]();
    })
  );
  $$("[data-shift]").forEach((b) =>
    b.addEventListener("click", () => {
      const d = b.dataset.shift;
      const dr = d === "up" ? 1 : d === "down" ? -1 : 0;
      const dc = d === "left" ? 1 : d === "right" ? -1 : 0;
      edit(() => (S.cells = S.cells.map((_, i) => S.cells[idx((Math.floor(i / S.cols) + dr + S.rows) % S.rows, ((i % S.cols) + dc + S.cols) % S.cols)])));
    })
  );

  /* ---------------- files: library, save, open ---------------- */
  function serialize() {
    const colours = [...new Set(S.cells)];
    const map = new Map(colours.map((h, i) => [h, i]));
    return {
      app: "icoa-uru-pattern",
      version: 1,
      name: S.name,
      rows: S.rows,
      cols: S.cols,
      background: S.bg,
      colours: colours.map((hex) => ({ hex, name: nameOf(hex), finish: finishOf(hex) })),
      cells: S.cells.map((h) => map.get(h)),
      updatedAt: new Date().toISOString(),
    };
  }
  function load(data, opts) {
    if (!data || !Array.isArray(data.cells) || !data.rows || !data.cols) throw new Error("bad file");
    if (floating) cancelFloating();
    sel = null;
    const colours = (data.colours || []).map((c) => ({ hex: norm(c.hex) || "#ffffff", name: c.name || "Custom colour", finish: FINISH_NAMES[c.finish] ? c.finish : "opaque" }));
    // colours that aren't in the palette become "my colours"
    let added = false;
    for (const c of colours) {
      if (!PALETTE.find((p) => p.hex === c.hex) && !S.custom.find((p) => p.hex === c.hex)) {
        S.custom.push(c);
        added = true;
      }
    }
    if (added) store.set(KEY.custom, S.custom);
    S.rows = clamp(data.rows | 0, 3, 40);
    S.cols = clamp(data.cols | 0, 10, 200);
    S.bg = norm(data.background) || colours[0]?.hex || "#f1e9dc";
    S.cells = Array.from({ length: S.rows * S.cols }, (_, i) => colours[data.cells[i]]?.hex || S.bg);
    S.name = data.name || "Untitled pattern";
    S.id = opts && opts.id !== undefined ? opts.id : null;
    $("#name").value = S.name;
    renderPalettes();
  }
  const library = () => store.get(KEY.lib, []);
  function thumb() {
    const c = document.createElement("canvas");
    const k = 4;
    c.width = S.cols * k;
    c.height = Math.round(S.rows * k * 0.7);
    const g = c.getContext("2d");
    const h = c.height / S.rows;
    S.cells.forEach((hex, i) => {
      g.fillStyle = hex;
      g.fillRect((i % S.cols) * k, Math.floor(i / S.cols) * h, k, Math.ceil(h));
    });
    return c.toDataURL("image/png");
  }
  async function saveToLibrary(asCopy) {
    if (!S.id || asCopy) {
      const name = await askName(asCopy ? `${S.name} copy` : S.name === "Untitled pattern" ? "" : S.name, asCopy ? "Save a copy" : "Save pattern");
      if (!name) return;
      S.name = name;
      $("#name").value = name;
      S.id = uid();
    }
    const entry = { id: S.id, ...serialize(), thumb: thumb() };
    const lib = library().filter((p) => p.id !== S.id);
    lib.unshift(entry);
    if (!store.set(KEY.lib, lib)) return toast("Couldn't save: storage is full. Use Save to a file instead.");
    S.savedSig = sig();
    markSaved();
    autosave();
    toast(`Saved "${S.name}" to My patterns.`);
  }
  async function saveFile() {
    const json = JSON.stringify(serialize(), null, 1);
    const fname = (S.name || "pattern").replace(/[^\w\- ]+/g, "").trim() + ".icoa-pattern.json";
    if (await saveText(fname, json, "pattern")) toast("Saved the pattern file. Open it again any time with Open a file.");
  }
  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function openFile(file) {
    try {
      const data = JSON.parse(typeof file === "string" ? file : await file.text());
      const before = snap();
      load(data);
      past.push(before);
      future = [];
      changed(true);
      fitZoom();
      toast(`Opened "${S.name}".`);
    } catch (e) {
      toast("That file isn't a pattern from Pattern Studio.");
    }
  }
  $("#fileOpen").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) openFile(f);
    e.target.value = "";
  });

  function renderLibrary() {
    const list = $("#libList");
    const lib = library();
    list.innerHTML = "";
    $("#libSub").textContent = lib.length ? `${lib.length} saved on this computer. Use Save to a file, or Back up everything, to keep a copy elsewhere.` : "Nothing saved yet.";
    if (!lib.length) {
      list.innerHTML = '<p class="empty">Press Save to keep the pattern you are working on. Saved patterns appear here.</p>';
      return;
    }
    for (const p of lib) {
      const card = document.createElement("div");
      card.className = "card" + (p.id === S.id ? " current-card" : "");
      const date = new Date(p.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      card.innerHTML = `<button class="thumb" aria-label="Open ${escapeHtml(p.name)}"><img alt="" src="${p.thumb || ""}" /></button>
        <div class="info"><b>${escapeHtml(p.name)}</b><span>${p.cols} × ${p.rows} beads, ${date}</span></div>
        <div class="row"></div>`;
      const row = card.querySelector(".row");
      const btn = (text, ic, fn, cls) => {
        const b = document.createElement("button");
        b.innerHTML = icon(ic) + text;
        if (cls) b.className = cls;
        b.addEventListener("click", fn);
        row.append(b);
      };
      const open = () => {
        const before = snap();
        load(p, { id: p.id });
        S.savedSig = sig();
        past.push(before);
        future = [];
        changed(true);
        fitZoom();
        $("#dlgLib").close();
        toast(`Opened "${p.name}".`);
      };
      card.querySelector(".thumb").addEventListener("click", open);
      btn("Open", "open", open);
      btn("File", "download", () => download(new Blob([JSON.stringify({ ...p, thumb: undefined, id: undefined }, null, 1)], { type: "application/json" }), p.name.replace(/[^\w\- ]+/g, "") + ".icoa-pattern.json"));
      btn(
        "Delete",
        "trash",
        async () => {
          if (!(await confirmBox(`Delete "${p.name}"?`, "It's removed from My patterns. This can't be undone.", "Delete"))) return;
          store.set(
            KEY.lib,
            library().filter((x) => x.id !== p.id)
          );
          if (S.id === p.id) {
            S.id = null;
            markSaved();
          }
          renderLibrary();
        },
        "del"
      );
      list.append(card);
    }
  }
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------------- picture → pattern ---------------- */
  function importImage(file) {
    const url = typeof file === "string" ? file : URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // crop the middle of the picture to the band's real shape
      const bandAspect = (S.cols * BEAD_MM) / (S.rows * ROW_MM);
      let sw = img.width;
      let sh = sw / bandAspect;
      if (sh > img.height) {
        sh = img.height;
        sw = sh * bandAspect;
      }
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      const k = 6; // sample 6x6 pixels per bead
      const c = document.createElement("canvas");
      c.width = S.cols * k;
      c.height = S.rows * k;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.imageSmoothingQuality = "high";
      g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      const choices = [...PALETTE, ...S.custom].map((p) => ({ hex: p.hex, rgb: rgbOf(p.hex) }));
      edit(() => {
        for (let r = 0; r < S.rows; r++)
          for (let col = 0; col < S.cols; col++) {
            let R = 0,
              G = 0,
              B = 0,
              n = 0;
            for (let y = 0; y < k; y++)
              for (let x = 0; x < k; x++) {
                const o = ((r * k + y) * c.width + col * k + x) * 4;
                if (px[o + 3] < 40) continue;
                R += px[o];
                G += px[o + 1];
                B += px[o + 2];
                n++;
              }
            S.cells[idx(r, col)] = n ? nearest([R / n, G / n, B / n], choices) : S.bg;
          }
      });
      toast("Turned the picture into beads using the Miyuki colours. Undo if you don't like it.", true);
    };
    img.onerror = () => toast("That picture couldn't be opened.");
    img.src = url;
  }
  function nearest(rgb, choices) {
    let best = choices[0].hex;
    let bd = Infinity;
    for (const ch of choices) {
      const rm = (rgb[0] + ch.rgb[0]) / 2;
      const dr = rgb[0] - ch.rgb[0];
      const dg = rgb[1] - ch.rgb[1];
      const db = rgb[2] - ch.rgb[2];
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) {
        bd = d;
        best = ch.hex;
      }
    }
    return best;
  }
  $("#fileImage").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importImage(f);
    e.target.value = "";
  });

  /* ---------------- export + print ---------------- */
  function renderImage(cellW, withLegend) {
    const cw = cellW;
    const ch = Math.round((cw * ROW_MM) / BEAD_MM);
    const pad = Math.round(cw * 1.4);
    const counts = new Map();
    S.cells.forEach((h) => counts.set(h, (counts.get(h) || 0) + 1));
    const legend = withLegend ? [...counts.entries()].sort((a, b) => b[1] - a[1]) : [];
    const perRow = Math.max(1, Math.floor((S.cols * cw) / 260));
    const legendH = legend.length ? Math.ceil(legend.length / perRow) * 34 + 70 : 0;
    const c = document.createElement("canvas");
    c.width = S.cols * cw + pad * 2;
    c.height = S.rows * ch + pad * 2 + legendH;
    const g = c.getContext("2d");
    g.fillStyle = "#fbf7f2";
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#efe6da";
    roundRect(g, pad - 8, pad - 8, S.cols * cw + 16, S.rows * ch + 16, 12);
    g.fill();
    const sw = (cw * 1.03) / (2 / 2.2);
    for (let r = 0; r < S.rows; r++)
      for (let col = 0; col < S.cols; col++) {
        const hex = S.cells[idx(r, col)];
        g.drawImage(beadImg(hex, finishOf(hex), sw), pad + col * cw + cw / 2 - sw / 2, pad + r * ch + ch / 2 - sw / 2, sw, sw);
      }
    if (legend.length) {
      const y0 = pad * 2 + S.rows * ch;
      g.fillStyle = "#4a2e22";
      g.font = '500 22px "Iowan Old Style", Georgia, serif';
      g.fillText(`${S.name}`, pad, y0 + 6);
      g.font = '14px "Segoe UI", system-ui, sans-serif';
      g.fillStyle = "#8a7468";
      g.fillText(`${S.cols} beads long × ${S.rows} rows, ${(S.rows * S.cols).toLocaleString()} beads, about ${((S.cols * BEAD_MM) / 10).toFixed(1)} × ${((S.rows * ROW_MM) / 10).toFixed(1)} cm`, pad, y0 + 30);
      legend.forEach(([hex, n], i) => {
        const x = pad + (i % perRow) * 260;
        const y = y0 + 52 + Math.floor(i / perRow) * 34;
        g.drawImage(beadImg(hex, finishOf(hex), 32), x, y - 6, 32, 32);
        g.fillStyle = "#4a2e22";
        g.font = '14px "Segoe UI", system-ui, sans-serif';
        g.fillText(`${nameOf(hex)}  ${hex.toUpperCase()}`, x + 40, y + 9);
        g.fillStyle = "#8a7468";
        g.fillText(`${n} beads`, x + 40, y + 26);
      });
    }
    return c;
  }
  function chartImage() {
    // flat, numbered chart that's easy to follow while weaving
    const cw = 16;
    const ch = 12;
    const L = 26;
    const T = 18;
    const c = document.createElement("canvas");
    c.width = L + S.cols * cw + 4;
    c.height = T + S.rows * ch + 4;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    S.cells.forEach((hex, i) => {
      g.fillStyle = hex;
      g.fillRect(L + (i % S.cols) * cw, T + Math.floor(i / S.cols) * ch, cw, ch);
    });
    g.strokeStyle = "rgba(0,0,0,.25)";
    g.lineWidth = 0.5;
    g.beginPath();
    for (let col = 0; col <= S.cols; col++) {
      g.moveTo(L + col * cw, T);
      g.lineTo(L + col * cw, T + S.rows * ch);
    }
    for (let r = 0; r <= S.rows; r++) {
      g.moveTo(L, T + r * ch);
      g.lineTo(L + S.cols * cw, T + r * ch);
    }
    g.stroke();
    g.strokeStyle = "rgba(0,0,0,.6)";
    g.lineWidth = 1;
    g.beginPath();
    for (let col = 0; col <= S.cols; col += 10) {
      g.moveTo(L + col * cw, T);
      g.lineTo(L + col * cw, T + S.rows * ch);
    }
    g.stroke();
    g.fillStyle = "#333";
    g.font = "9px sans-serif";
    g.textAlign = "center";
    for (let col = 0; col < S.cols; col++) if ((col + 1) % 5 === 0 || col === 0) g.fillText(String(col + 1), L + col * cw + cw / 2, 12);
    g.textAlign = "right";
    for (let r = 0; r < S.rows; r++) g.fillText(String(r + 1), L - 4, T + r * ch + 9);
    return c;
  }
  function printChart() {
    const counts = new Map();
    S.cells.forEach((h) => counts.set(h, (counts.get(h) || 0) + 1));
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([hex, n]) => `<tr><td><span class="s" style="background:${hex}"></span></td><td>${escapeHtml(nameOf(hex))}</td><td>${hex.toUpperCase()}</td><td>${FINISH_NAMES[finishOf(hex)]}</td><td>${n} beads</td></tr>`)
      .join("");
    buildPrintSheet(rows);
    setTimeout(() => window.print(), 60);
  }
  function buildPrintSheet(rowsHtml) {
    let rows = rowsHtml;
    if (!rows) {
      const counts = new Map();
      S.cells.forEach((h) => counts.set(h, (counts.get(h) || 0) + 1));
      rows = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([hex, n]) => `<tr><td><span class="s" style="background:${hex}"></span></td><td>${escapeHtml(nameOf(hex))}</td><td>${hex.toUpperCase()}</td><td>${FINISH_NAMES[finishOf(hex)]}</td><td>${n} beads</td></tr>`)
        .join("");
    }
    $("#print").innerHTML = `<h1>${escapeHtml(S.name)}</h1>
      <p>${S.cols} beads long × ${S.rows} rows (${(S.rows * S.cols).toLocaleString()} beads), about ${((S.cols * BEAD_MM) / 10).toFixed(1)} × ${((S.rows * ROW_MM) / 10).toFixed(1)} cm. Miyuki 11/0 round seed beads.</p>
      <img src="${renderImage(30, false).toDataURL("image/png")}" alt="" />
      <img src="${chartImage().toDataURL("image/png")}" alt="" style="margin-top:6mm" />
      <table>${rows}</table>`;
  }

  const ACTIONS = {
    saveAs: () => saveToLibrary(true),
    saveFile,
    openFile: async () => {
      const f = await pickFile("pattern");
      if (f && f.text) openFile(f.text);
    },
    importImage: async () => {
      const f = await pickFile("image");
      if (f && f.dataUrl) importImage(f.dataUrl);
    },
    exportPng: () =>
      renderImage(36, true).toBlob(async (b) => {
        if (await saveBlob((S.name || "pattern").replace(/[^\w\- ]+/g, "") + ".png", b, "png")) toast("Saved the picture.");
      }),
    print: printChart,
    pdf: async () => {
      if (!NATIVE) return printChart();
      buildPrintSheet();
      const r = await NATIVE.savePdf({ name: (S.name || "pattern").replace(/[^\w\- ]+/g, "") + " bead chart.pdf" });
      if (r && r.saved) toast("Saved the bead chart as a PDF.");
    },
    backup: backupAll,
    restore: restoreBackup,
    shortcuts: () => $("#dlgKeys").showModal(),
  };

  /* ---------------- dialogs + toast ---------------- */
  function askName(value, title, sub) {
    return new Promise((resolve) => {
      const d = $("#dlgName");
      $("#nameTitle").textContent = title;
      $("#nameSub").textContent = sub || "Give it a name you'll recognise.";
      $("#nameInput").value = value;
      d.returnValue = "";
      d.showModal();
      $("#nameInput").select();
      d.addEventListener(
        "close",
        () => {
          const v = $("#nameInput").value.trim();
          resolve(d.returnValue === "ok" && v ? v : null);
        },
        { once: true }
      );
    });
  }
  function confirmBox(title, text, ok) {
    return new Promise((resolve) => {
      const d = $("#dlgConfirm");
      $("#cfTitle").textContent = title;
      $("#cfText").textContent = text;
      $("#cfOk").textContent = ok || "OK";
      d.returnValue = "";
      d.showModal();
      d.addEventListener("close", () => resolve(d.returnValue === "ok"), { once: true });
    });
  }
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  $$("dialog").forEach((d) =>
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    })
  );
  let toastTimer = 0;
  function toast(text, withUndo) {
    const t = $("#toast");
    t.innerHTML = "";
    t.append(document.createTextNode(text));
    if (withUndo) {
      const b = document.createElement("button");
      b.textContent = "Undo";
      b.addEventListener("click", () => {
        undo();
        t.classList.remove("show");
      });
      t.append(b);
    }
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), withUndo ? 5000 : 2600);
  }

  /* ---------------- header buttons ---------------- */
  $("#undo").addEventListener("click", undo);
  $("#redo").addEventListener("click", redo);
  $("#save").addEventListener("click", () => saveToLibrary(false));
  $("#library").addEventListener("click", () => {
    renderLibrary();
    $("#dlgLib").showModal();
  });
  $("#new").addEventListener("click", async () => {
    if (S.cells.some((v) => v !== S.bg) && sig() !== S.savedSig) {
      if (!(await confirmBox("Start a new pattern?", "This one hasn't been saved to My patterns. You can still get it back with Undo.", "Start new"))) return;
    }
    edit(() => {
      S.cells = S.cells.map(() => S.bg);
    });
    S.id = null;
    S.name = "Untitled pattern";
    $("#name").value = S.name;
    S.savedSig = "";
    markSaved();
  });
  $("#name").addEventListener("input", (e) => {
    S.name = e.target.value.trim() || "Untitled pattern";
    markSaved();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autosave, 350);
  });
  const more = $("#more");
  const closeMenu = () => {
    more.classList.remove("open");
    more.querySelector("button").setAttribute("aria-expanded", "false");
  };
  more.querySelector("button").addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !more.classList.contains("open");
    more.classList.toggle("open", open);
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!more.contains(e.target)) closeMenu();
  });

  /* ---------------- zoom ---------------- */
  function setZoom(z, keepCenter) {
    const stage = $("#stage");
    const fx = (stage.scrollLeft + stage.clientWidth / 2) / Math.max(1, stage.scrollWidth);
    S.zoom = clamp(Math.round(z * 100) / 100, 0.4, 4);
    $("#zoom").value = Math.round(S.zoom * 100);
    $("#zoomVal").textContent = Math.round(S.zoom * 100) + "%";
    draw();
    if (keepCenter) stage.scrollLeft = fx * stage.scrollWidth - stage.clientWidth / 2;
    savePrefs();
  }
  function fitZoom() {
    const stage = $("#stage");
    const availW = stage.clientWidth - 56 - RULER_L - PAD * 2 - 8;
    const availH = stage.clientHeight - 56 - RULER_T - PAD * 2 - 8;
    const byW = availW / (S.cols * BASE_CELL);
    const byH = availH / (S.rows * BASE_CELL * 0.7);
    setZoom(clamp(Math.min(byW, byH), 0.4, 3));
  }
  $("#zoom").addEventListener("input", (e) => setZoom(Number(e.target.value) / 100, true));
  $("#zoomIn").addEventListener("click", () => setZoom(S.zoom * 1.2, true));
  $("#zoomOut").addEventListener("click", () => setZoom(S.zoom / 1.2, true));
  $("#fit").addEventListener("click", fitZoom);
  $("#stage").addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), true);
    },
    { passive: false }
  );
  $("#grid").addEventListener("change", (e) => {
    S.grid = e.target.checked;
    redraw();
    savePrefs();
  });
  $("#real").addEventListener("change", (e) => {
    S.real = e.target.checked;
    redraw();
    savePrefs();
  });
  window.addEventListener("resize", redraw);

  /* drag a pattern file or a picture onto the page */
  const stage = $("#stage");
  stage.addEventListener("dragover", (e) => {
    const types = [...e.dataTransfer.types];
    if (types.includes("text/icoa-sprite")) {
      e.preventDefault();
      hover = cellAt(e);
      const sp = spriteById(stage.dataset.dragSprite || "");
      if (sp && (!place || place.id !== sp.id)) place = { id: sp.id, name: sp.name, w: sp.w, h: sp.h, cells: sp.cells.slice() };
      return redraw();
    }
    if (!types.includes("Files")) return;
    e.preventDefault();
    stage.classList.add("drop");
  });

  stage.addEventListener("dragleave", (e) => {
    stage.classList.remove("drop");
    if (S.tool !== "place" && !stage.contains(e.relatedTarget)) {
      place = null;
      redraw();
    }
  });
  stage.addEventListener("drop", (e) => {
    e.preventDefault();
    stage.classList.remove("drop");
    const spriteId = e.dataTransfer.getData("text/icoa-sprite");
    if (spriteId) {
      const sp = spriteById(spriteId);
      const at = cellAt(e);
      if (sp && at) {
        const p = { w: sp.w, h: sp.h, cells: sp.cells };
        edit(() => stampPiece(p, at.c - Math.floor(sp.w / 2), at.r - Math.floor(sp.h / 2)));
        toast(`Placed ${sp.name}.`, true);
      }
      if (S.tool !== "place") place = null;
      return redraw();
    }
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (/json$/i.test(f.name) || f.type === "application/json") openFile(f);
    else if (f.type.startsWith("image/")) importImage(f);
  });

  /* ---------------- status bar ---------------- */
  function showStatus() {
    const selInfo = floating ? ` · moving ${floating.w} × ${floating.h}` : hasSel() ? ` · ${sel.reduce((a, b) => a + b, 0)} selected` : "";
    $("#sSel").textContent = selInfo.replace(" · ", "");
    if (!hover) {
      $("#sPos").textContent = `${S.cols} × ${S.rows} beads`;
      $("#sCol").innerHTML = "";
      return;
    }
    const hex = S.cells[idx(hover.r, hover.c)];
    $("#sPos").textContent = `Bead ${hover.c + 1}, row ${hover.r + 1}`;
    $("#sCol").innerHTML = `<span class="swatch" style="background:${hex}"></span>${escapeHtml(nameOf(hex))} <span class="hexv">${hex.toUpperCase()}</span>`;
  }

  /* ---------------- keyboard ---------------- */
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== "checkbox" && e.target.type !== "range";
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === "s") {
      e.preventDefault();
      return e.shiftKey ? saveFile() : saveToLibrary(false);
    }
    if (mod && k === "o") {
      e.preventDefault();
      return ACTIONS.openFile();
    }
    if (mod && k === "p") {
      e.preventDefault();
      return printChart();
    }
    if (typing) return;
    if (e.key === "Escape" && menuEl) return closeCtxMenu();
    if (mod && k === "c") {
      if (hasSel() || floating) {
        e.preventDefault();
        copySel();
      }
      return;
    }
    if (mod && k === "x") {
      e.preventDefault();
      return cutSel();
    }
    if (mod && k === "v") {
      e.preventDefault();
      return pasteClip();
    }
    if (mod && k === "a") {
      e.preventDefault();
      return selectAll();
    }
    if (mod && k === "d") {
      e.preventDefault();
      return deselect();
    }
    if (mod && e.shiftKey && k === "i") {
      e.preventDefault();
      return invertSel();
    }
    if (mod && k === "e") {
      e.preventDefault();
      return saveSelectionAsSprite();
    }
    if (!mod) {
      const busy = floating || hasSel();
      if (e.key === "Escape") {
        if (place) return stopPlacing();
        if (floating) return floating.origin === "paste" ? cancelFloating() : commitFloating(false);
        if (sel) return deselect();
      }
      if (e.key === "Enter" && floating) return commitFloating();
      if ((e.key === "Delete" || e.key === "Backspace") && busy) {
        e.preventDefault();
        return deleteSel();
      }
      if (e.key.startsWith("Arrow") && busy) {
        e.preventDefault();
        const n = e.shiftKey ? 5 : 1;
        const d = { ArrowLeft: [-n, 0], ArrowRight: [n, 0], ArrowUp: [0, -n], ArrowDown: [0, n] }[e.key];
        return moveFloating(d[0], d[1]);
      }
      if (place && S.tool === "place") {
        const op = { "[": "rotL", "]": "rotR", h: "flipH", v: "flipV" }[k];
        if (op) {
          place = { ...place, ...PIECE[op](place) };
          renderOptions();
          return redraw();
        }
      } else if (busy) {
        const op = { "[": "rotL", "]": "rotR", h: "flipH", v: "flipV" }[k];
        if (op) return transformSelection(op);
      }
      if (e.key === "?") return $("#dlgKeys").showModal();
    }
    if (mod && k === "z") {
      e.preventDefault();
      if (floating) {
        return floating.origin === "paste" ? cancelFloating() : cancelFloating();
      }
      return e.shiftKey ? redo() : undo();
    }
    if (mod && k === "y") {
      e.preventDefault();
      return redo();
    }
    if (mod) return;
    if (k === "x") return swapColours();
    if (k === "+" || k === "=") return setZoom(S.zoom * 1.2, true);
    if (k === "-") return setZoom(S.zoom / 1.2, true);
    if (k === "0") return fitZoom();
    const t = TOOLS.find((x) => x.key && x.key.toLowerCase() === k);
    if (t) setTool(t.id);
  });

  /* ---------------- start ---------------- */
  function savePrefs() {
    store.set(KEY.prefs, { zoom: S.zoom, grid: S.grid, real: S.real, primary: S.primary, secondary: S.secondary, dockOpen: S.dockOpen });
  }
  function startingPattern() {
    // a simple diamond band so there's something to look at
    const rows = 10;
    const cols = 63;
    const cells = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const p = c % 14;
        const d = Math.abs(p - 6.5) + Math.abs(r - 4.5);
        cells.push(d < 2 ? "#e8a82a" : d < 4 ? "#2e7c79" : d < 5 ? "#c65a42" : "#f1e9dc");
      }
    return cells;
  }
  function init() {
    $$("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)));
    S.custom = store.get(KEY.custom, []);
    const prefs = store.get(KEY.prefs, {});
    S.grid = prefs.grid !== false;
    S.real = prefs.real !== false;
    $("#grid").checked = S.grid;
    $("#real").checked = S.real;
    const cur = store.get(KEY.cur, null);
    let restored = false;
    if (cur) {
      try {
        load(cur, { id: cur.id || null });
        S.savedSig = cur.savedSig || "";
        S.primary = norm(cur.primary) || S.primary;
        S.secondary = norm(cur.secondary) || S.secondary;
        S.bg = norm(cur.bg) || S.bg;
        restored = true;
      } catch (e) {
        /* start fresh */
      }
    }
    if (!restored) {
      S.cells = startingPattern();
      S.primary = norm(prefs.primary) || S.primary;
      S.secondary = norm(prefs.secondary) || S.secondary;
    }
    loadSprites();
    S.dockOpen = prefs.dockOpen !== false;
    renderTools();
    setTool("pencil");
    renderPalettes();
    renderDock();
    spriteEditorWiring();
    $("#dockToggle").addEventListener("click", () => {
      S.dockOpen = !S.dockOpen;
      renderDock();
      savePrefs();
    });
    $("#spriteSearch").addEventListener("input", (e) => {
      S.spriteQuery = e.target.value;
      renderDock();
    });
    $("#spriteFromSel").addEventListener("click", saveSelectionAsSprite);
    $("#spriteImport").addEventListener("click", async () => {
      const f = await pickFile("sprites");
      if (f && f.text) importSpritesText(f.text);
    });
    $("#spriteExport").addEventListener("click", () => (S.sprites.length ? exportSprites(S.sprites) : toast("No sprites to save yet.")));
    if (NATIVE) {
      document.body.classList.add("is-app");
      $("#sKeep").textContent = "Your work is saved on this computer automatically.";
    }
    changed(true);
    showStatus();
    if (prefs.zoom) setZoom(prefs.zoom);
    else requestAnimationFrame(fitZoom);
    if (restored) toast(`Welcome back. "${S.name}" is just as you left it.`);
  }
  init();
  // for checking things in the browser console
  window.patternStudio = { state: S, undo, redo, serialize, layout, get sel() { return sel; }, get floating() { return floating; }, get clip() { return clip; }, get place() { return place; } };
})();
