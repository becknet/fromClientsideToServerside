const supportedAttributes = [
  "element",
  "type",
  "name",
  "required",
  "min",
  "max",
  "minlength",
  "maxlength",
  "pattern",
  "multiple",
  "values",
];

const examples = [
  '<input type="email" name="email" required maxlength="30">',
  '<input type="text" name="username" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+">',
  '<input type="number" name="age" required min="18" max="120">',
  '<input type="checkbox" name="newsletter" value="yes" required>',
  '<input type="checkbox" name="hobbies[]" value="sport">\n<input type="checkbox" name="hobbies[]" value="musik">\n<input type="checkbox" name="hobbies[]" value="gaming">\n<input type="checkbox" name="hobbies[]" value="fotografie">',
  '<input type="radio" name="payment" value="card" required>\n<input type="radio" name="payment" value="paypal">\n<input type="radio" name="payment" value="invoice">',
  '<select name="country" required>\n  <option value="">Bitte waehlen</option>\n  <option value="ch">Schweiz</option>\n  <option value="de">Deutschland</option>\n</select>',
  '<textarea name="message" required minlength="10" maxlength="500"></textarea>',
];

const inputSource = document.querySelector("#inputSource");
const generateButton = document.querySelector("#generateButton");
const clearButton = document.querySelector("#clearButton");
const exampleButton = document.querySelector("#exampleButton");
const copyButton = document.querySelector("#copyButton");
const attributeList = document.querySelector("#attributeList");
const phpOutput = document.querySelector("#phpOutput");
const statusMessage = document.querySelector("#status");

let exampleIndex = 0;

function parseFormControl(source) {
  const template = document.createElement("template");
  template.innerHTML = source.trim();
  const controls = [...template.content.querySelectorAll("input, select, textarea")];

  if (controls.length === 0) {
    throw new Error("Bitte gib ein valides Formularfeld ein.");
  }

  if (isRadioGroup(controls)) {
    return parseRadioGroup(controls);
  }

  if (isCheckboxGroup(controls)) {
    return parseCheckboxGroup(controls);
  }

  if (controls.length !== 1) {
    throw new Error("Bitte gib genau ein Formularfeld, eine Radio-Gruppe oder eine Checkbox-Gruppe mit gleichem name ein.");
  }

  const control = controls[0];
  const element = control.tagName.toLowerCase();

  if (!control.name.trim()) {
    throw new Error("Das Formularfeld braucht ein name-Attribut.");
  }

  if (element === "input") {
    return parseInput(control);
  }

  if (element === "select") {
    return parseSelect(control);
  }

  if (element === "textarea") {
    return parseTextarea(control);
  }

  throw new Error("Dieses Formularfeld wird noch nicht unterstuetzt.");
}

function isRadioGroup(controls) {
  if (controls.length < 2) {
    return false;
  }

  const firstName = controls[0].getAttribute("name");
  return controls.every((control) => (
    control.tagName.toLowerCase() === "input"
    && String(control.getAttribute("type") || "text").toLowerCase() === "radio"
    && control.getAttribute("name") === firstName
  ));
}

function isCheckboxGroup(controls) {
  if (controls.length < 2) {
    return false;
  }

  const firstName = controls[0].getAttribute("name");
  return controls.every((control) => (
    control.tagName.toLowerCase() === "input"
    && String(control.getAttribute("type") || "text").toLowerCase() === "checkbox"
    && control.getAttribute("name") === firstName
  ));
}

function parseInput(input) {
  const type = String(input.getAttribute("type") || "text").toLowerCase();
  const attributes = collectCommonAttributes(input, {
    element: "input",
    type,
    multiple: input.name.endsWith("[]"),
  });

  if (type === "checkbox") {
    attributes.values = [input.getAttribute("value") || "on"];
  }

  if (type === "radio") {
    attributes.values = [input.getAttribute("value") || "on"];
  }

  validateAttributes(attributes);
  return attributes;
}

function parseRadioGroup(radios) {
  const fieldName = radios[0].name.trim();

  if (!fieldName) {
    throw new Error("Die Radio-Gruppe braucht ein name-Attribut.");
  }

  const attributes = collectCommonAttributes(radios[0], {
    element: "input",
    type: "radio",
    name: fieldName,
    required: radios.some((radio) => radio.hasAttribute("required")),
    multiple: false,
    values: uniqueValues(radios.map((radio) => radio.getAttribute("value") || "on")),
  });

  validateAttributes(attributes);
  return attributes;
}

function parseCheckboxGroup(checkboxes) {
  const fieldName = checkboxes[0].name.trim();

  if (!fieldName) {
    throw new Error("Die Checkbox-Gruppe braucht ein name-Attribut.");
  }

  const attributes = collectCommonAttributes(checkboxes[0], {
    element: "input",
    type: "checkbox",
    name: fieldName,
    required: checkboxes.some((checkbox) => checkbox.hasAttribute("required")),
    multiple: fieldName.endsWith("[]"),
    values: uniqueValues(checkboxes.map((checkbox) => checkbox.getAttribute("value") || "on")),
  });

  validateAttributes(attributes);
  return attributes;
}

function parseSelect(select) {
  const values = [...select.options]
    .map((option) => option.value)
    .filter((value) => value !== "");

  const attributes = collectCommonAttributes(select, {
    element: "select",
    type: "select",
    multiple: select.hasAttribute("multiple") || select.name.endsWith("[]"),
    values: uniqueValues(values),
  });

  validateAttributes(attributes);
  return attributes;
}

function parseTextarea(textarea) {
  const attributes = collectCommonAttributes(textarea, {
    element: "textarea",
    type: "textarea",
  });

  validateAttributes(attributes);
  return attributes;
}

function collectCommonAttributes(control, overrides = {}) {
  const attributes = {
    element: control.tagName.toLowerCase(),
    type: control.getAttribute("type") || control.tagName.toLowerCase(),
    name: control.name.trim(),
    required: control.hasAttribute("required"),
    multiple: false,
    ...overrides,
  };

  ["min", "max", "minlength", "maxlength", "pattern"].forEach((attribute) => {
    if (control.hasAttribute(attribute)) {
      attributes[attribute] = control.getAttribute(attribute);
    }
  });

  return attributes;
}

function validateAttributes(attributes) {
  if (!attributes.name) {
    throw new Error("Das Formularfeld braucht ein name-Attribut.");
  }

  validateNumericAttribute(attributes, "minlength", "Ganzzahl ab 0");
  validateNumericAttribute(attributes, "maxlength", "Ganzzahl ab 0");
  validateNumericAttribute(attributes, "min", "Zahl");
  validateNumericAttribute(attributes, "max", "Zahl");
}

function validateNumericAttribute(attributes, attribute, expectedLabel) {
  if (!Object.hasOwn(attributes, attribute) || attributes[attribute] === "") {
    return;
  }

  const value = Number(attributes[attribute]);
  const requiresInteger = attribute === "minlength" || attribute === "maxlength";
  const isInvalid = Number.isNaN(value)
    || (requiresInteger && (!Number.isInteger(value) || value < 0));

  if (isInvalid) {
    throw new Error(`Das Attribut ${attribute} braucht einen gueltigen Wert (${expectedLabel}).`);
  }
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function phpString(value) {
  return `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function phpRegex(pattern) {
  return phpString(`~^${String(pattern).replaceAll("~", "\\~")}$~`);
}

function phpArray(values) {
  return `[${values.map((value) => phpString(value)).join(", ")}]`;
}

function phpErrorLine(message, indentation = "    ") {
  return `${indentation}$error .= ${phpString(`${message}<br>`)};`;
}

function phpVariableName(field) {
  const sanitized = field.replace(/[^A-Za-z0-9_]/g, "_");
  const normalized = sanitized.replace(/^[^A-Za-z_]+/, "");
  return `$${normalized || "value"}`;
}

function postFieldName(attributes) {
  if (attributes.multiple && attributes.name.endsWith("[]")) {
    return attributes.name.slice(0, -2);
  }

  return attributes.name;
}

function renderAttributes(attributes) {
  attributeList.innerHTML = supportedAttributes.map((attribute) => {
    let value = attributes[attribute] ?? "-";

    if (attribute === "required") {
      value = attributes.required ? "ja" : "nein";
    }

    if (attribute === "multiple") {
      value = attributes.multiple ? "ja" : "nein";
    }

    if (attribute === "values" && Array.isArray(attributes.values)) {
      value = attributes.values.length ? attributes.values.join(", ") : "-";
    }

    return `<dt>${escapeHtml(attribute)}</dt><dd>${escapeHtml(value)}</dd>`;
  }).join("");
}

function buildPhpValidation(attributes) {
  const field = postFieldName(attributes);
  const fieldPhp = phpString(field);
  const valueVariable = phpVariableName(field);
  const lines = [
    "<?php",
    "$error = '';",
    "",
    `if (!isset($_POST[${fieldPhp}])) {`,
  ];

  if (attributes.required) {
    lines.push(phpErrorLine(`Das Feld ${field} ist erforderlich.`));
  } else {
    lines.push("    // Optionales Feld wurde nicht uebermittelt.");
  }

  lines.push("} else {");

  if (attributes.multiple) {
    buildMultipleValueValidation(lines, attributes, valueVariable, fieldPhp, field);
    lines.push("}");
    return lines.join("\n");
  }

  lines.push(`    ${valueVariable} = trim((string) $_POST[${fieldPhp}]);`);

  if (attributes.required && attributes.type !== "checkbox") {
    lines.push(
      "",
      `    if (empty(${valueVariable}) && ${valueVariable} !== '0') {`,
      phpErrorLine(`Das Feld ${field} ist erforderlich.`, "        "),
      "    }"
    );
  }

  lines.push("", `    if (${valueVariable} !== '') {`);

  addTypeValidation(lines, attributes, valueVariable, fieldPhp, field);
  addAllowedValuesValidation(lines, attributes, valueVariable, fieldPhp, field);
  addLengthValidation(lines, attributes, valueVariable, fieldPhp, field);
  addMinMaxValidation(lines, attributes, valueVariable, fieldPhp, field);
  addPatternValidation(lines, attributes, valueVariable, fieldPhp, field);

  lines.push("    }", "}");

  return lines.join("\n");
}

function buildMultipleValueValidation(lines, attributes, valueVariable, fieldPhp, field) {
  lines.push(
    `    ${valueVariable} = $_POST[${fieldPhp}];`,
    "",
    `    if (!is_array(${valueVariable})) {`,
    phpErrorLine(`Das Feld ${field} muss als Liste uebermittelt werden.`, "        "),
    "    }"
  );

  if (attributes.required) {
    lines.push(
      "",
      `    if (empty(${valueVariable})) {`,
      phpErrorLine(`Bitte waehle mindestens eine Option fuer ${field}.`, "        "),
      "    }"
    );
  }

  lines.push("", `    if (is_array(${valueVariable}) && !empty(${valueVariable})) {`);
  addAllowedArrayValuesValidation(lines, attributes, valueVariable, fieldPhp, field);
  lines.push("    }");
}

function addTypeValidation(lines, attributes, valueVariable, fieldPhp, field) {
  const type = String(attributes.type || "text").toLowerCase();

  if (type === "email") {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_EMAIL) === false) {`,
      phpErrorLine(`Das Feld ${field} muss eine gueltige E-Mail-Adresse sein.`, "            "),
      "        }"
    );
    return;
  }

  if (type === "url") {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_URL) === false) {`,
      phpErrorLine(`Das Feld ${field} muss eine gueltige URL sein.`, "            "),
      "        }"
    );
    return;
  }

  if (type === "number" || type === "range") {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_FLOAT) === false) {`,
      phpErrorLine(`Das Feld ${field} muss eine Zahl sein.`, "            "),
      "        }"
    );
  }
}

function addAllowedValuesValidation(lines, attributes, valueVariable, fieldPhp, field) {
  if (!Array.isArray(attributes.values) || attributes.values.length === 0) {
    return;
  }

  lines.push(
    `        $allowedValues = ${phpArray(attributes.values)};`,
    `        if (!in_array(${valueVariable}, $allowedValues, true)) {`,
    phpErrorLine(`Das Feld ${field} enthaelt keinen erlaubten Wert.`, "            "),
    "        }"
  );
}

function addAllowedArrayValuesValidation(lines, attributes, valueVariable, fieldPhp, field) {
  if (!Array.isArray(attributes.values) || attributes.values.length === 0) {
    return;
  }

  lines.push(
    `        $allowedValues = ${phpArray(attributes.values)};`,
    `        foreach (${valueVariable} as $selectedValue) {`,
    "            $selectedValue = trim((string) $selectedValue);",
    "            if (!in_array($selectedValue, $allowedValues, true)) {",
    phpErrorLine(`Das Feld ${field} enthaelt mindestens einen nicht erlaubten Wert.`, "                "),
    "                break;",
    "            }",
    "        }"
  );
}

function addLengthValidation(lines, attributes, valueVariable, fieldPhp, field) {
  if (attributes.minlength) {
    lines.push(
      `        if (mb_strlen(${valueVariable}) < ${Number(attributes.minlength)}) {`,
      phpErrorLine(`Das Feld ${field} ist zu kurz.`, "            "),
      "        }"
    );
  }

  if (attributes.maxlength) {
    lines.push(
      `        if (mb_strlen(${valueVariable}) > ${Number(attributes.maxlength)}) {`,
      phpErrorLine(`Das Feld ${field} ist zu lang.`, "            "),
      "        }"
    );
  }
}

function addMinMaxValidation(lines, attributes, valueVariable, fieldPhp, field) {
  const type = String(attributes.type || "text").toLowerCase();
  const isNumericType = type === "number" || type === "range";

  if (!isNumericType) {
    return;
  }

  if (attributes.min) {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_FLOAT) !== false && (float) ${valueVariable} < ${Number(attributes.min)}) {`,
      phpErrorLine(`Das Feld ${field} ist zu klein.`, "            "),
      "        }"
    );
  }

  if (attributes.max) {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_FLOAT) !== false && (float) ${valueVariable} > ${Number(attributes.max)}) {`,
      phpErrorLine(`Das Feld ${field} ist zu gross.`, "            "),
      "        }"
    );
  }
}

function addPatternValidation(lines, attributes, valueVariable, fieldPhp, field) {
  if (!attributes.pattern) {
    return;
  }

  lines.push(
    `        if (!preg_match(${phpRegex(attributes.pattern)}, ${valueVariable})) {`,
    phpErrorLine(`Das Feld ${field} hat ein ungueltiges Format.`, "            "),
    "        }"
  );
}

function generate() {
  try {
    const attributes = parseFormControl(inputSource.value);
    renderAttributes(attributes);
    phpOutput.textContent = buildPhpValidation(attributes);
    statusMessage.textContent = "PHP-Validierung wurde erzeugt.";
    statusMessage.classList.remove("error");
  } catch (error) {
    renderAttributes({ element: "-", type: "-", name: "-", required: false });
    phpOutput.textContent = "";
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");
  }
}

generateButton.addEventListener("click", generate);

clearButton.addEventListener("click", () => {
  inputSource.value = "";
  inputSource.focus();
  generate();
});

exampleButton.addEventListener("click", () => {
  exampleIndex = (exampleIndex + 1) % examples.length;
  inputSource.value = examples[exampleIndex];
  generate();
});

copyButton.addEventListener("click", async () => {
  if (!phpOutput.textContent.trim()) {
    return;
  }

  await navigator.clipboard.writeText(phpOutput.textContent);
  statusMessage.textContent = "PHP-Code wurde kopiert.";
  statusMessage.classList.remove("error");
});

inputSource.addEventListener("input", generate);

generate();
