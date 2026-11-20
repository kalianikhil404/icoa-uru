# Icoa-Uru website, version 2

This is the shop website for Icoa-Uru handwoven loom bracelets. It has:

- **The website** customers see.
- **The website editor**, where you change products, photos, words, prices and colours and see each change right away.

You don't need to know any code to use them.

---

## 1. Start it (double-click)

1. Open this folder and double-click **`Start Website.bat`**.
   - **The first time only:** if Node.js isn't installed, the Node.js download page opens. Install the **LTS** version (click Next until it finishes), then double-click `Start Website.bat` again.
   - It then downloads the parts the website needs, which takes a few minutes. After that it starts in seconds.
2. A black window opens. **Leave it open.** Closing it stops the website.
3. Your browser opens the **control center** at `http://localhost:3000/control`.

**Shortcut:** double-click **`Open Icoa-Uru.html`**. It shows whether the website is running, and gives you buttons for the control center, the website and the editor.

> A web page can't start programs on your computer, because browsers block that for safety. So the `.bat` file starts the website, and the `.html` page is your front door.

### Open it on phones and other computers on your WiFi

The website runs for your whole WiFi, not just this computer.

- The **control center** shows the WiFi address (it looks like `http://192.168.1.23:3000`) and a QR code. Scan the code with a phone camera, or type the address into any browser on the same WiFi.
- **The first time**, Windows may ask whether Node.js may use the network. Tick **Private networks** and click **Allow**. If you clicked Cancel by mistake, search Windows for *"Allow an app through Windows Firewall"* and tick both boxes next to **Node.js**.
- The computer running the website must stay on and awake. Other devices only work while the black window is open.
- Orders placed from any device appear in the control center under **Orders** (section 4).

---

## 2. Change the website (the editor)

Open **`http://localhost:3000/admin`**, or click **Website editor** in the control center.

| Area | What you do there |
| --- | --- |
| **Left** | Pick what to change: Home page, Products, Collections, About, Questions, Reviews, Shop & checkout, Sizes & beads, Bead colours, Brand colours, Page titles & policies. |
| **Middle** | Change it: type, choose, switch on or off, drag photos in. |
| **Right** | The live website. It updates by itself about a second after each change. Use the laptop and phone buttons to see both sizes. |

**Saving and undoing:**
- **Everything saves by itself.** The top bar says *All changes saved*.
- **Undo / Redo** (the arrows at the top, or `Ctrl+Z` / `Ctrl+Y`) step back and forward through your changes.
- **Save version** saves a named copy of the whole website, like a bookmark, for example *"Before the holiday sale"*.
- **Versions** lists every saved copy. A copy is also made automatically each time the editor opens. Click **Go back** to return the whole website to how it was then. What you had before is saved as a version first, so nothing is lost.

**Products:**
- **Add bracelet** creates a new one. Fill in the name and price, and drag in photos (the first photo is the main one).
- **Duplicate** copies a bracelet, which is handy for a new colourway.
- Set **In stock** to 0 to show *Sold out*.
- Photos are resized and optimised automatically. iPhone *HEIC* photos need to be JPG: on the iPhone, go to Settings → Camera → Formats → **Most Compatible**.

**Using the editor from another device (optional):** for safety, the editor only opens on the computer that runs the website. To use it from another laptop on the WiFi, copy `.env.example` and rename the copy to `.env.local`. Put a password after `ADMIN_PASSWORD=`, then start the website again.

---

## 3. Pattern Studio

Pattern Studio is now its own app: **Icoa-Uru Pattern Studio.exe**, in the **Pattern Studio** folder next to this one. It doesn't need this website or the internet.

---

## 4. Orders, customers, visitors and emails (the control center)

Open **`http://localhost:3000/control`** (it opens by itself when you start the website). On the left:

| Section | What's there |
| --- | --- |
| **Overview** | Orders to do, sales, visitors and subscribers at a glance, plus the WiFi address and QR code. |
| **Orders** | Every order, with search and filters (To do, New, Paid, Weaving, Shipped, Delivered, Cancelled). Open one to change its status, add a tracking number, write a note the customer sees, keep private notes, or copy the address for the shipping label. |
| **Customers** | Everyone who ordered: their address, phone, orders and how much they've spent. |
| **Subscribers** | Everyone who signed up for emails, where they signed up and when (your proof of consent). You can unsubscribe or add people. |
| **Visitors** | How many people visit, which pages and bracelets they look at, what goes in bags, where visitors come from and what devices they use. Click a visitor to see everything they did. Names and emails appear once someone orders or signs up. |
| **Emails** | Connect your email, change the wording of every automatic email, and set up the newsletter. |

Every list has a **Download spreadsheet** button, which opens in Excel or Google Sheets.

### What customers see
- After ordering, customers get an email with a **private link** to their order. **My orders** (in the footer and the phone menu) lists orders placed on that device, and anyone can find an order with its number and email.
- When you change an order's status, their page updates and, if you tick the box, they get an email. Tracking numbers become a **Track the parcel** button for Canada Post, UPS, FedEx, Purolator and DHL.

### Connect your email (about 5 minutes, Gmail)
1. Control center → **Emails** → choose **Gmail**.
2. On the Gmail account the shop sends from, turn on **2-Step Verification** (Google Account → Security).
3. Open <https://myaccount.google.com/apppasswords>, create one called "Icoa-Uru website" and copy the 16 letters.
4. Paste your Gmail address and that app password, fill in **Your website address**, **Send new-order alerts to** and your **Business mailing address**, then press **Save**, **Check connection** and **Send test**.

Gmail sends up to about 500 emails a day. For more, use **Resend** (needs your own domain).

### Automatic emails and the newsletter
- These send by themselves: **Order received**, **New order alert** (to you), **Payment received**, **On the loom**, **Shipped**, **Delivered**, **Cancelled** and **Welcome** (new subscriber). Click one to change its words, switch it off, or send yourself a test. Words in {curly brackets} like {first_name} are filled in for each person.
- **Newsletter**: write the subject, message and an optional offer, and choose which bracelets to show. Send it now, or set it to go out **every day, week or month** at a set time. It only goes to people who signed up.
- Canada's anti-spam law (CASL) requires every newsletter to include your name, a mailing address and an unsubscribe link. Those are added automatically once your address is filled in. Unsubscribes take effect immediately. Only add people by hand if they told you yes.
- Daily emails tend to cause unsubscribes. Weekly or monthly usually works better for a small shop.

### Payments
- Customers pay by **Interac e-Transfer**. The instructions are in their confirmation email and on their order page. Mark the order **Paid** when the money arrives.
- **Card payments (optional):** put your Stripe secret key in `.env.local` as `STRIPE_SECRET_KEY` and set `NEXT_PUBLIC_STRIPE_ENABLED=true`. Card orders arrive already marked Paid.

### Privacy
- Visitors see a small notice and can choose **No thanks**. Browsers set to Do Not Track or Global Privacy Control are never counted.
- The **Privacy** section of your policies (Website editor → Page titles & policies) explains what's kept. Keep it accurate if you change things.

---

## 5. Put it on the internet

So anyone can visit, not just your WiFi:

1. Make your changes in the editor on this computer.
2. Double-click **`Publish Website.bat`**. It checks the website for errors, then uploads it to **Vercel**, a free hosting service.
   - **The first time**, it asks you to log in. A browser window opens and you can sign up free with Google, GitHub or email.
   - It then asks a few setup questions. Press **Enter** to accept each suggested answer.
3. At the end, it prints a line starting with **Production:**. That's your live website address.

**To update the live website later:** edit as usual, then double-click `Publish Website.bat` again.

### One-time setup so the live website keeps orders, subscribers and visits
Websites on Vercel can't save files, so the live shop needs a small free database:

1. On <https://vercel.com>, open your project → **Storage** → **Create** → **Upstash for Redis** (free) → connect it to the project.
2. Project → **Settings** → **Environment Variables**: add **`ADMIN_PASSWORD`** with a password only you know. This is what opens `/control` on the live website.
3. If you use card payments, add the same Stripe values as in your `.env.local`.
4. Double-click `Publish Website.bat` again.

Then:
- Open **`your-website-address/control`** from any phone or computer and enter the password to manage orders.
- To see the online orders on your computer's control center too, copy the two `KV_REST_API_…` values from Vercel into `.env.local`.
- Email settings are saved where the orders are. Once the database is connected, set up **Emails** in the live control center too.
- On the live website, the automatic newsletter is checked once a day (around 10–11 am Toronto time). The scheduled time you pick applies on your computer.

**Good to know:**
- The website editor works only on your computer, so strangers can't change the shop. Edit here, then publish.
- **Your own domain** (like `icoa-uru.com`): buy it from any domain seller, then add it in Vercel → your project → Settings → Domains.

---

## 6. Where everything lives (for VS Code)

```
website v2/
├─ Start Website.bat         double-click: starts the website for this computer + WiFi
├─ Publish Website.bat       double-click: puts it online (Vercel)
├─ Open Icoa-Uru.html        front door: links to everything
├─ src/content/              ALL the words, products, prices and colours (.json files)
│                            the editor changes these for you; you can also edit them by hand
├─ public/images/            photos (products/, brand/, uploads from the editor)
├─ src/app/(site)/           the website's pages (home, shop, about, …)
├─ src/app/(tools)/          the editor (/admin) and control center (/control)
├─ src/components/           the building blocks of the pages
├─ orders/                   orders received on this computer (not published)
├─ data/                     customers, subscribers, visits, email settings (not published)
└─ .history/                 saved versions from the editor (not published)
```

### Useful commands (in VS Code's terminal)
| Command | What it does |
| --- | --- |
| `npm run start-site` | Same as double-clicking Start Website.bat |
| `npm run dev` | Start for this computer and WiFi, without opening the browser |
| `npm run build` | Check everything is ready to go live |
| `npm run publish` | Same as Publish Website.bat (after a build) |
| `npm run lint` | Look for mistakes in the code |

### Built with
Next.js 16, Tailwind CSS 4, shadcn/ui, Motion (Framer Motion), Magic UI, Zustand, Zod, Resend and Stripe. The seed beads are drawn by a small 3D renderer (`src/lib/seed-bead.ts`) modelled on Miyuki 11/0 round beads: 2.0 mm across, 1.3 mm tall, with a 0.8 mm hole.

---

## 7. If something goes wrong

| Problem | Fix |
| --- | --- |
| The black window closes straight away | Click the folder's address bar, type `cmd` and press Enter. In the window that opens, type `npm run start-site` and press Enter to read the message. |
| *Port 3000 is busy* | The website is probably already running in another black window. Use that one, or close it and start again. |
| Phones can't open the WiFi address | Same WiFi? Firewall allowed (section 1)? Some guest or school WiFi networks block devices from seeing each other. |
| The preview in the editor looks stuck | Click the circular arrow above the preview to reload it. |
| A change broke a page | Click **Undo**, or **Versions → Go back** to an earlier version. |
