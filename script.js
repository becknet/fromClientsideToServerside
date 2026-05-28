const supportedAttributes = [
  "type",
  "name",
  "required",
  "min",
  "max",
  "minlength",
  "maxlength",
  "pattern",
];

const examples = [
  '<input type="email" name="email" required maxlength="30">',
  '<input type="text" name="username" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+">',
  '<input type="number" name="age" required min="18" max="120">',
  '<input type="url" name="website" maxlength="200">',
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

function parseInputTag(source) {
  const template = document.createElement("template");
  template.innerHTML = source.trim();
  const input = template.content.querySelector("input");

  if (!input || template.content.querySelectorAll("input").length !== 1) {
    throw new Error("Bitte gib genau ein valides <input>-Element ein.");
  }

  if (!input.name.trim()) {
    throw new Error("Das Input-Feld braucht ein name-Attribut.");
  }

  const attributes = supportedAttributes.reduce((result, attribute) => {
    if (attribute === "required") {
      result.required = input.hasAttribute("required");
      return result;
    }

    if (input.hasAttribute(attribute)) {
      result[attribute] = input.getAttribute(attribute);
    }

    return result;
  }, {
    type: input.getAttribute("type") || "text",
    name: input.name.trim(),
    required: input.hasAttribute("required"),
  });

  validateNumericAttribute(attributes, "minlength", "Ganzzahl ab 0");
  validateNumericAttribute(attributes, "maxlength", "Ganzzahl ab 0");
  validateNumericAttribute(attributes, "min", "Zahl");
  validateNumericAttribute(attributes, "max", "Zahl");

  return attributes;
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

function phpVariableName(field) {
  const sanitized = field.replace(/[^A-Za-z0-9_]/g, "_");
  const normalized = sanitized.replace(/^[^A-Za-z_]+/, "");
  return `$${normalized || "value"}`;
}

function renderAttributes(attributes) {
  attributeList.innerHTML = supportedAttributes.map((attribute) => {
    const value = attribute === "required"
      ? (attributes.required ? "ja" : "nein")
      : (attributes[attribute] ?? "-");

    return `<dt>${escapeHtml(attribute)}</dt><dd>${escapeHtml(value)}</dd>`;
  }).join("");
}

function buildPhpValidation(attributes) {
  const field = attributes.name;
  const fieldPhp = phpString(field);
  const valueVariable = phpVariableName(field);
  const lines = [
    "<?php",
    "$errors = [];",
    "",
    `if (!isset($_POST[${fieldPhp}])) {`,
    `    $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} wurde nicht uebermittelt.`)};`,
    "} else {",
    `    ${valueVariable} = trim((string) $_POST[${fieldPhp}]);`,
  ];

  if (attributes.required) {
    lines.push(
      "",
      `    if (empty(${valueVariable}) && ${valueVariable} !== '0') {`,
      `        $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} ist erforderlich.`)};`,
      "    }"
    );
  }

  lines.push("", `    if (${valueVariable} !== '') {`);

  addTypeValidation(lines, attributes, valueVariable, fieldPhp, field);
  addLengthValidation(lines, attributes, valueVariable, fieldPhp, field);
  addMinMaxValidation(lines, attributes, valueVariable, fieldPhp, field);
  addPatternValidation(lines, attributes, valueVariable, fieldPhp, field);

  lines.push("    }", "}");

  return lines.join("\n");
}

function addTypeValidation(lines, attributes, valueVariable, fieldPhp, field) {
  const type = String(attributes.type || "text").toLowerCase();

  if (type === "email") {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_EMAIL) === false) {`,
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} muss eine gueltige E-Mail-Adresse sein.`)};`,
      "        }"
    );
    return;
  }

  if (type === "url") {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_URL) === false) {`,
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} muss eine gueltige URL sein.`)};`,
      "        }"
    );
    return;
  }

  if (type === "number" || type === "range") {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_FLOAT) === false) {`,
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} muss eine Zahl sein.`)};`,
      "        }"
    );
  }
}

function addLengthValidation(lines, attributes, valueVariable, fieldPhp, field) {
  if (attributes.minlength) {
    lines.push(
      `        if (strlen(${valueVariable}) < ${Number(attributes.minlength)}) {`,
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} ist zu kurz.`)};`,
      "        }"
    );
  }

  if (attributes.maxlength) {
    lines.push(
      `        if (strlen(${valueVariable}) > ${Number(attributes.maxlength)}) {`,
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} ist zu lang.`)};`,
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
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} ist zu klein.`)};`,
      "        }"
    );
  }

  if (attributes.max) {
    lines.push(
      `        if (filter_var(${valueVariable}, FILTER_VALIDATE_FLOAT) !== false && (float) ${valueVariable} > ${Number(attributes.max)}) {`,
      `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} ist zu gross.`)};`,
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
    `            $errors[${fieldPhp}] = ${phpString(`Das Feld ${field} hat ein ungueltiges Format.`)};`,
    "        }"
  );
}

function generate() {
  try {
    const attributes = parseInputTag(inputSource.value);
    renderAttributes(attributes);
    phpOutput.textContent = buildPhpValidation(attributes);
    statusMessage.textContent = "PHP-Validierung wurde erzeugt.";
    statusMessage.classList.remove("error");
  } catch (error) {
    renderAttributes({ type: "-", name: "-", required: false });
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
