# Rozetka Cleaner (Chrome Extension, MV3)

Розширення приховує:
- червону промо-ціну в картках (`button.red-label`, `[data-testid="promo-price"]`);
- плаваючий віджет/кнопку `Rozetka AI` (через селектори + текстовий fallback).

## Встановлення (локально)

1. Відкрийте `chrome://extensions`.
2. Увімкніть `Developer mode`.
3. Натисніть `Load unpacked`.
4. Виберіть папку:

`/Users/eurusik/Documents/New project`

## Файли

- `manifest.json` - налаштування розширення.
- `styles.css` - CSS-приховування червоної ціни.
- `content.js` - JS-приховування + `MutationObserver` для динамічних оновлень сторінки.

## Примітка

Якщо Rozetka змінить верстку/класи, оновіть селектори в `styles.css` і `content.js`.
