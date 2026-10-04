#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

total=0
reported=0
report_limit=50
color_count=0
transition_count=0
important_count=0
svg_count=0
inline_count=0
breakpoint_count=0

record_violation() {
  local category="$1"
  local location="$2"
  total=$((total + 1))
  case "$category" in
    colors) color_count=$((color_count + 1)) ;;
    transitions) transition_count=$((transition_count + 1)) ;;
    important) important_count=$((important_count + 1)) ;;
    svg) svg_count=$((svg_count + 1)) ;;
    inline) inline_count=$((inline_count + 1)) ;;
    breakpoints) breakpoint_count=$((breakpoint_count + 1)) ;;
  esac
  if (( reported < report_limit )); then
    printf '  %s: %s\n' "$category" "$location"
  elif (( reported == report_limit )); then
    printf '  Further findings omitted; see category totals below.\n'
  fi
  reported=$((reported + 1))
}

is_exempt() {
  local category="$1"
  local file="$2"
  case "$category:$file" in
    colors:styles/tokens.css|\
    colors:components/InvoicePdfPreview/InvoicePdfPreview.module.css|\
    colors:components/PaymentQrModal/PaymentQrModal.module.css|\
    colors:app/custom-qr/page.module.css)
      return 0
      ;;
    important:styles/base.css|\
    important:components/InvoicePdfPreview/InvoicePdfPreview.module.css)
      return 0
      ;;
    svg:components/ui/Icon/Icon.js|\
    svg:components/MarketplaceLogo/MarketplaceLogo.js)
      return 0
      ;;
  esac
  return 1
}

scan_css_pattern() {
  local category="$1"
  local pattern="$2"
  local file
  local matches
  local line

  while IFS= read -r file; do
    local relative="${file#./}"
    if is_exempt "$category" "$relative"; then
      continue
    fi
    matches="$(grep -nE "$pattern" "$file" || true)"
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      record_violation "$category" "$relative:$line"
    done <<< "$matches"
  done < <(find app components styles -type f -name '*.css' -print 2>/dev/null | sort)
}

scan_js_pattern() {
  local category="$1"
  local pattern="$2"
  local file
  local matches
  local line

  while IFS= read -r file; do
    local relative="${file#./}"
    if is_exempt "$category" "$relative"; then
      continue
    fi
    matches="$(grep -nE "$pattern" "$file" || true)"
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      record_violation "$category" "$relative:$line"
    done <<< "$matches"
  done < <(find app components -type f \( -name '*.js' -o -name '*.jsx' \) -print 2>/dev/null | sort)
}

printf 'Checking UI CSS and JSX conventions...\n'
scan_css_pattern colors '#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\('
scan_css_pattern transitions 'transition[[:space:]]*:[[:space:]]*all([[:space:];]|$)'
scan_css_pattern important '!important'
scan_js_pattern svg '<svg([[:space:]>])'

while IFS= read -r file; do
  relative="${file#./}"
  matches="$(grep -nE '@media[^{]*(max|min)-width:[[:space:]]*[0-9]+px' "$file" || true)"
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    width="$(printf '%s\n' "$line" | sed -E 's/.*(max|min)-width:[[:space:]]*([0-9]+)px.*/\2/')"
    case "$width" in
      640|768|1024|1280) ;;
      *) record_violation breakpoints "$relative:$line" ;;
    esac
  done <<< "$matches"
done < <(find app components styles -type f -name '*.css' -print 2>/dev/null | sort)

if ! node -e 'require.resolve("@babel/parser")' >/dev/null 2>&1; then
  printf 'Unable to check inline styles: @babel/parser is unavailable.\n' >&2
  exit 2
fi

if ! INLINE_RESULTS="$(node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function isStatic(node) {
  if (!node) return false;
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral' || node.type === 'NullLiteral') return true;
  if (node.type === 'TemplateLiteral') return node.expressions.length === 0;
  if (node.type === 'UnaryExpression') return ['+', '-'].includes(node.operator) && isStatic(node.argument);
  if (node.type === 'ArrayExpression') return node.elements.every(isStatic);
  if (node.type === 'ObjectExpression') return node.properties.every((property) => property.type === 'ObjectProperty' && !property.computed && isStatic(property.value));
  return false;
}

const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.jsx?$/.test(entry.name)) files.push(file);
  }
}
walk('app');
walk('components');

const results = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  } catch (error) {
    console.error(`Unable to parse ${file}: ${error.message}`);
    process.exitCode = 2;
    continue;
  }
  traverse(ast, {
    JSXAttribute(attributePath) {
      if (attributePath.node.name.name !== 'style') return;
      const value = attributePath.node.value;
      if (value?.type !== 'JSXExpressionContainer' || value.expression.type !== 'ObjectExpression') return;
      if (!isStatic(value.expression)) return;
      const location = attributePath.node.loc.start.line;
      results.push(`${file}:${location}`);
    },
  });
}
console.log(results.join('\n'));
NODE
)"; then
  printf 'Unable to complete inline-style analysis.\n' >&2
  exit 2
fi

while IFS= read -r location; do
  [[ -z "$location" ]] && continue
  record_violation inline "$location"
done <<< "$INLINE_RESULTS"

printf '\nUI guard summary: %d violation(s) (%d colors, %d transitions, %d !important, %d raw SVG, %d static inline styles, %d breakpoints).\n' \
  "$total" "$color_count" "$transition_count" "$important_count" "$svg_count" "$inline_count" "$breakpoint_count"

if (( total > 0 )); then
  exit 1
fi