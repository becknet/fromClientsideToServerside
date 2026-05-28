# HTML-Input zu PHP-Validierung

Kleine Vanilla-Webapp, die aus einem einzelnen HTML-`<input>`-String ein serverseitiges PHP-Validierungs-Snippet erzeugt.

Beispiel:

```html
<input type="email" name="email" required maxlength="30">
```

Die App erkennt clientseitige Validierungsattribute und übersetzt sie in PHP-Prüfungen mit `isset()`, `empty()`, `strlen()`, `filter_var()` und `preg_match()`.

## Nutzung

Die App besteht nur aus statischen Dateien:

- `index.html`
- `style.css`
- `script.js`

Sie kann direkt im Browser geöffnet oder über MAMP bereitgestellt werden. Wenn der Ordner im MAMP-`htdocs`-Verzeichnis liegt, ist die App typischerweise über eine lokale URL wie diese erreichbar:

```text
http://localhost/fromClientsideToServerside/
```

Alternativ kann ein lokaler PHP-Server im Projektordner gestartet werden:

```bash
php -S 127.0.0.1:8000
```

Danach:

```text
http://127.0.0.1:8000/
```

## Unterstützte Attribute

- `type`
- `name`
- `required`
- `min`
- `max`
- `minlength`
- `maxlength`
- `pattern`

Unterstützte `type`-Validierungen:

- `email` mit `filter_var(..., FILTER_VALIDATE_EMAIL)`
- `url` mit `filter_var(..., FILTER_VALIDATE_URL)`
- `number` und `range` mit `filter_var(..., FILTER_VALIDATE_FLOAT)` sowie `min`/`max`
- Textbasierte Typen mit Längen- und Pattern-Prüfung

## Hinweise

Die Ausgabe ist ein PHP-Snippet für `$_POST`, kein vollständiger Formular-Handler. Es wird genau ein `<input>`-Element verarbeitet, und das Element muss ein `name`-Attribut besitzen.
