# HTML-Input zu PHP-Validierung

Kleine Vanilla-Webapp, die aus einem HTML-Formularfeld ein serverseitiges PHP-Validierungs-Snippet erzeugt.

Beispiel:

```html
<input type="email" name="email" required maxlength="30">
```

Die App erkennt clientseitige Validierungsattribute und übersetzt sie in PHP-Prüfungen mit `isset()`, `empty()`, `strlen()`, `filter_var()`, `preg_match()` und Wertelisten-Prüfung für Auswahlfelder.

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

- `element`
- `type`
- `name`
- `required`
- `min`
- `max`
- `minlength`
- `maxlength`
- `pattern`
- `multiple`
- erlaubte Werte aus `value` oder `<option value="...">`

Unterstützte Formularfelder:

- `input`
- `textarea`
- `select`
- Checkboxen
- Checkbox-Gruppen mit `name="feldname[]"`
- einzelne Radio-Buttons und Radio-Gruppen mit gleichem `name`

Unterstützte Typ-Validierungen:

- `email` mit `filter_var(..., FILTER_VALIDATE_EMAIL)`
- `url` mit `filter_var(..., FILTER_VALIDATE_URL)`
- `number` und `range` mit `filter_var(..., FILTER_VALIDATE_FLOAT)` sowie `min`/`max`
- Textbasierte Typen mit Längen- und Pattern-Prüfung
- `checkbox`, `radio` und `select` mit Prüfung erlaubter Werte über `in_array()`
- Checkbox-Arrays mit `is_array()` und Prüfung jedes ausgewählten Werts

## Hinweise

Die Ausgabe ist ein PHP-Snippet für `$_POST`, kein vollständiger Formular-Handler. Es wird ein Formularfeld verarbeitet; bei Radio-Buttons und Checkbox-Arrays sind auch Gruppen mit gleichem `name` möglich. Jedes Feld muss ein `name`-Attribut besitzen.

Weitere Beispiele:

```html
<input type="checkbox" name="newsletter" value="yes" required>
```

```html
<input type="checkbox" name="hobbies[]" id="sport" value="sport">
<input type="checkbox" name="hobbies[]" id="musik" value="musik">
<input type="checkbox" name="hobbies[]" id="gaming" value="gaming">
<input type="checkbox" name="hobbies[]" id="fotografie" value="fotografie">
```

```html
<input type="radio" name="payment" value="card" required>
<input type="radio" name="payment" value="paypal">
<input type="radio" name="payment" value="invoice">
```

```html
<select name="country" required>
  <option value="">Bitte waehlen</option>
  <option value="ch">Schweiz</option>
  <option value="de">Deutschland</option>
</select>
```

```html
<textarea name="message" required minlength="10" maxlength="500"></textarea>
```
