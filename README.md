# Icoa-Uru

Everything for Icoa-Uru handwoven bead bracelets.

| Folder | What it is |
|---|---|
| `website/` | The shop website, the website editor and the control center |
| `pattern-studio/` | Icoa-Uru Pattern Studio, the desktop app for designing bracelet patterns |

## Getting it on another computer

1. Install **Node.js** (the LTS version) from <https://nodejs.org>.
2. On this page, click the green **Code** button, then **Download ZIP**, and unzip it. (Or, if you use Git: `git clone` this repository.)
3. **Website:** open the `website` folder and double-click **Start Website.bat**. The first start takes a few minutes while it gets everything it needs.
4. **Pattern Studio:** download the ready-made .exe from **Releases** on the right of this page, or open `pattern-studio` and double-click **Build Pattern Studio.bat** to make it yourself.

## What isn't in here (on purpose)

These stay only on the computer that runs the shop, because they hold private details:

- `website/.env.local`: email and payment settings and passwords
- `website/orders/` and `website/data/`: orders, customers, subscribers and visits
- `website/.history/`: the editor's saved versions

On a new computer, set up email again in the control center (**Emails**), or copy those folders across yourself.
