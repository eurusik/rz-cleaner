## Chrome Web Store Release

Version: `1.7.5`

Upload file: `release/rz-cleaner-v1.7.5-chrome-store.zip`

### What's new
Fixed compatibility with recent Rozetka markup updates. The extension now reliably hides the Rozetka AI widget, correctly handles the new card-price layout in product tiles, and keeps the regular price visible and readable.

### UA variant
Виправлено сумісність із новими змінами розмітки Rozetka. Розширення тепер стабільно ховає віджет Rozetka AI, коректно обробляє нову структуру ціни “за карткою” в плитках товарів та зберігає звичайну ціну видимою і читабельною.

### Release summary
- fixed dynamic hide of `rz-chat-bot-button-assist` host nodes
- added support for both AI consultation DOM variants
- adapted promo cleanup for `rz-tile-red-price`
- restored larger regular price style when card-price block is hidden
- added regression tests for updated markup scenarios

### Submission checklist
- upload `release/rz-cleaner-v1.7.5-chrome-store.zip`
- confirm version `1.7.5` in the Chrome Web Store draft
- paste one of the “What's new” texts above
