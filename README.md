# Cool I Guess Crew ★

Сайт-коллекция в эстетике нулевых: рабочий стол старого Mac OS, MTV / old internet / Y2K
поп-культура — будто случайно открыл компьютер девушки-художницы той эпохи.

- **`index.html`** — главная: имя коллекции + голосование «кто кулее» (VS) + топ по голосам.
- **`countdown.html`** — полный чарт в стиле MTV TRL (Total Request Live).

Голосование пока считается локально в браузере (`localStorage`) — работает на GitHub Pages
без бэкенда. Когда захочется *общее* голосование для всех — см. раздел ниже.

---

## Картинки коллекции (2000 работ)

- Оригиналы (2000×2000 PNG, ~9.5 ГБ) лежат в папке **`Cool I Guess Crew/`**
  как `CIGC #1.png … CIGC #2000.png`. Они **не публикуются** (в `.gitignore`) —
  это слишком тяжело для GitHub.
- На сайт идут лёгкие превью **`images/<N>.jpg`** (480px, ~50 КБ, всего ~110 МБ).
- Список работ генерится автоматически из `assets/data.js` (`COLLECTION_SIZE = 2000`),
  руками ничего вписывать не нужно.

### Пересобрать превью
Если поменяешь оригиналы или захочешь другой размер/качество:
```bash
bash scripts/build-images.sh
```
(использует встроенный в macOS `sips`, параметры — вверху скрипта).

---

## Как выложить на GitHub (репо уже создан)

В терминале, находясь в папке проекта:

```bash
cd ~/Desktop/cooliguesscrew
git init
git add .
git commit -m "первый коммит: cool i guess crew"
git branch -M main
git remote add origin https://github.com/renatosgaripos-spec/cooliguesscrew.git
git push -u origin main
```

### Включить сайт (GitHub Pages)
1. На GitHub открой репозиторий → **Settings** → **Pages**.
2. **Source**: `Deploy from a branch`.
3. **Branch**: `main`, папка `/ (root)` → **Save**.
4. Через минуту сайт будет тут:
   `https://renatosgaripos-spec.github.io/cooliguesscrew/`

Дальше любые изменения: `git add . && git commit -m "..." && git push` — сайт обновится сам.

---

## Потом: настоящее общее голосование

Сейчас голоса у каждого свои (в его браузере). Чтобы голоса были общими для всех
посетителей, нужен маленький бесплатный бэкенд — например **Cloudflare Workers + KV**
(пара десятков строк). Скажи — подключу.
