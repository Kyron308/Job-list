# Job Tracker — Apple-friendly GitHub Pages app

A lightweight Microsoft Lists-style job tracker designed for Safari on Mac, iPhone and iPad.

## Features

- Add, edit and delete jobs
- Track customer, status, dates, location and notes
- Multiple views:
  - Jobs
  - Calendar
  - Task list
  - Parts & Tools
- Parts and tools lists are attached to each job
- Print-friendly parts/tools sheet
- Saves data locally in the browser using `localStorage`
- Export/import JSON backups
- PWA support for "Add to Home Screen"
- Works as a static site on GitHub Pages

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `sw.js`
3. Commit the files.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select your main branch and `/ (root)`.
7. Save.

GitHub will provide your Pages URL.

## Install on Apple devices

### iPhone / iPad
1. Open the GitHub Pages URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Open it from the Home Screen like a normal app.

### Mac
Open the site in Safari. On supported macOS versions, use **File → Add to Dock**.

## Important data note

This version stores data on the device/browser where it is used. It does **not** automatically sync jobs between an iPhone, iPad and Mac.

Use **Export backup** to save your data and **Import backup** to restore or move it.

For true multi-device syncing, the next version can be connected to a cloud database such as Supabase or Firebase.
