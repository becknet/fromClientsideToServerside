# AGENTS.md

## Projektkontext

Dieses Repo enthält eine kleine statische Webapp aus HTML, CSS und JavaScript. Sie generiert aus einem einzelnen HTML-`<input>`-String ein PHP-Validierungs-Snippet.

## Dateien

- `index.html`: Seitenstruktur und UI.
- `style.css`: Layout, responsive Darstellung und visuelle Gestaltung.
- `script.js`: Parsing des Input-Strings und Generierung des PHP-Codes.

## Arbeitsregeln

- Keine Build-Tools oder Frameworks einführen, solange die Aufgabe nicht ausdrücklich danach verlangt.
- Die App soll ohne Installation direkt im Browser oder unter MAMP laufen.
- Änderungen möglichst in den bestehenden drei App-Dateien halten.
- JavaScript-Parsing soll DOM-basiert bleiben, nicht auf fragilen Regex-only-Parsern beruhen.
- Generierter PHP-Code soll lesbar bleiben und die Lernfunktion der App unterstützen.

## Validierungslogik

Die App soll weiterhin diese PHP-Funktionen sichtbar verwenden, wenn die entsprechenden HTML-Attribute passen:

- `isset()` für übermittelte Felder.
- `empty()` für Pflichtfelder, mit Sonderbehandlung für den Wert `"0"`.
- `strlen()` für `minlength` und `maxlength`.
- `filter_var()` für `email`, `url`, `number` und `range`.
- `preg_match()` für `pattern`.

## Manuelle Prüfung

Für schnelle Checks:

```bash
node --check script.js
php -S 127.0.0.1:8000
```

Dann im Browser `http://127.0.0.1:8000/` öffnen.

Wichtige Testeingaben:

```html
<input type="email" name="email" required maxlength="30">
<input type="number" name="age" required min="0" max="120">
<input type="text" name="username" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+">
<input type="url" name="website" maxlength="200">
```
