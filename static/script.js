// Global variable to store token boundaries returned from the backend
window.tokenBoundaries = [];

/**
 * Fetch tokenization data from the backend.
 */
function updateTokens() {
  const text = document.getElementById('inputText').innerText;
  fetch('/tokenize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
    .then(response => response.json())
    .then(data => {
      // Update token count
      document.getElementById('tokenCount').innerText = 'Token Count: ' + data.token_count;

      // Update tokenized words display
      const tokensDisplay = document.getElementById('tokensDisplay');
      // Clear old tokens while preserving the header
      tokensDisplay.innerHTML = '<h3>Tokenized Words:</h3>';
      data.tokens.forEach((token, index) => {
  const span = document.createElement('span');
  span.className = 'token';
  let displayToken = token;
  if (displayToken.startsWith(' ')) {
    // Replace the leading space with a marker
    displayToken = '▁' + displayToken.slice(1);
  }
  span.innerText = displayToken;
  span.dataset.index = index;
  tokensDisplay.appendChild(span);
});


      // Update token IDs display
      const tokenIdsDisplay = document.getElementById('tokenIdsDisplay');
      tokenIdsDisplay.innerHTML = '<h3>Token IDs:</h3>';
      data.token_ids.forEach((tokenId, index) => {
        const span = document.createElement('span');
        span.className = 'token';
        span.innerText = tokenId;
        span.dataset.index = index;
        tokenIdsDisplay.appendChild(span);
      });

      window.tokenBoundaries = data.boundaries;
    })
    .catch(err => console.error(err));
}


/**
 * Wrap each character of the input text in a span so we can listen for hover events.
 */
/**
 * Save the current caret position within a container element.
 */
function saveSelection(containerEl) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(containerEl);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

/**
 * Restore the caret position within a container element given a character offset.
 */
function restoreSelection(containerEl, offset) {
  const range = document.createRange();
  range.selectNodeContents(containerEl);
  let charIndex = 0, nodeStack = [containerEl], node, found = false;

  while (nodeStack.length && !found) {
    node = nodeStack.shift();
    if (node.nodeType === 3) { // text node
      const nextCharIndex = charIndex + node.length;
      if (offset >= charIndex && offset <= nextCharIndex) {
        range.setStart(node, offset - charIndex);
        range.collapse(true);
        found = true;
        break;
      }
      charIndex = nextCharIndex;
    } else {
      // add child nodes to the beginning of the stack
      for (let i = 0; i < node.childNodes.length; i++) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  if (found) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

/**
 * Wrap each character of the input text in a span so we can listen for hover events.
 * This version preserves the caret position.
 */
function updateInputSpans() {
  const container = document.getElementById('inputText');
  const savedCaretPosition = saveSelection(container);
  const text = container.innerText;
  container.innerHTML = ''; // Clear current content

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'char';
    span.innerText = text[i];
    span.dataset.index = i;
    // When a character is hovered, highlight the corresponding token
    span.addEventListener('mouseover', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      highlightTokenAtIndex(index);
    });
    // Remove highlights when the mouse leaves the character
    span.addEventListener('mouseout', removeTokenHighlights);
    container.appendChild(span);
  }

  // Restore caret to its previous position
  restoreSelection(container, savedCaretPosition);
}


/**
 * Highlight the token that contains the character at the given index.
 */
function highlightTokenAtIndex(charIndex) {
  const boundaries = window.tokenBoundaries || [];
  let tokenIndex = -1;
  // Find which token’s boundaries include this character index
  for (let i = 0; i < boundaries.length; i++) {
    if (charIndex >= boundaries[i].start && charIndex < boundaries[i].end) {
      tokenIndex = i;
      break;
    }
  }
  removeTokenHighlights();
  if (tokenIndex !== -1) {
    const tokenSpans = document.querySelectorAll('.token');
    tokenSpans.forEach(span => {
      if (parseInt(span.dataset.index) === tokenIndex) {
        span.classList.add('highlight');
      }
    });
  }
}

/**
 * Remove highlight from all token elements.
 */
function removeTokenHighlights() {
  const tokenSpans = document.querySelectorAll('.token');
  tokenSpans.forEach(span => span.classList.remove('highlight'));
}

/**
 * Update both the tokenization and the input spans.
 */
function updateAll() {
  updateInputSpans();
  updateTokens();
}

// Listen for input events on the editable div
document.getElementById('inputText').addEventListener('input', updateAll);

// Optionally, update the spans when the div loses focus (in case of paste, etc.)
document.getElementById('inputText').addEventListener('blur', updateAll);

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  updateAll();
});
