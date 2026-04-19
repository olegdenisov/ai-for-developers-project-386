# Анализ ralphex: как использовать с минимальным числом токенов

Документ основан на анализе репозитория [`umputun/ralphex`](https://github.com/umputun/ralphex) по состоянию на 19 апреля 2026 года.

## Короткий вывод

`ralphex` экономит токены не за счёт специального сжатия контекста, а за счёт архитектуры выполнения:

1. Работа разбивается на отдельные короткие сессии вместо одного длинного диалога.
2. Для разных фаз можно назначать разные модели и разные уровни `effort`.
3. Ревью-циклы можно ограничивать, чтобы не тратить токены на повторяющиеся итерации.

## Как использовать ralphex с минимальным числом токенов

### 1. Самый дешёвый режим: только выполнение задач

Если нужен минимум токенов, основной режим:

```bash
ralphex --tasks-only docs/plans/feature.md
```

Что это даёт:

- запускается только фаза выполнения задач;
- пропускаются обе волны Claude-review;
- пропускается внешний review;
- резко снижается общее число LLM-вызовов.

Это лучший вариант, если тебе нужна именно автономная реализация по плану без дорогого многоэтапного контроля.

### 2. Более дешёвый компромисс: только внешний review

Если нужна независимая проверка, но без полного пайплайна:

```bash
ralphex --external-only
```

или:

```bash
ralphex --external-only docs/plans/feature.md
```

Этот режим дешевле полного запуска, потому что:

- нет task phase;
- нет первой волны review-агентов;
- нет второй волны review-агентов;
- остаётся только внешний review loop.

### 3. Сильно ограничивать повторные review-итерации

Именно повторные циклы часто съедают лишние токены. Для ограничения полезно:

```bash
ralphex --review-patience=1 --max-external-iterations=1 docs/plans/feature.md
```

или мягче:

```bash
ralphex --review-patience=2 --max-external-iterations=2 docs/plans/feature.md
```

Практический смысл:

- `review_patience` останавливает цикл, если несколько раундов подряд не происходит реального прогресса;
- `max_external_iterations` жёстко ограничивает число внешних проверок.

### 4. Не раздувать кастомные prompt'ы

Встроенные review-prompt'ы устроены экономно:

- diff не вставляется целиком в prompt;
- агентам предлагается самим вызвать `git diff`;
- агентам предлагается читать только нужные файлы в полном контексте.

Это правильный паттерн. Если вручную вшивать большие diff'ы или длинную историю обсуждения в кастомные prompt'ы, токенов станет заметно больше.

### 5. Разбивать план на короткие задачи

Так как `ralphex` работает по задачам, выгодно:

- делать задачи узкими;
- не собирать слишком много подзадач в одном шаге;
- уменьшать ширину диффа на одну итерацию.

Чем меньше объём изменений в рамках одной task-итерации, тем меньше контекст, который модель должна прочитать и проверить.

## Как в ralphex комбинируются модели и effort

В `ralphex` есть две отдельные зоны настройки моделей.

### 1. Настройки для Claude-фаз

Для task phase и review phases используются:

```ini
task_model = model[:effort]
review_model = model[:effort]
```

Поддерживаемый формат:

- `opus`
- `opus:high`
- `:medium`

То есть можно задавать:

- только модель;
- только `effort`;
- модель и `effort` вместе.

Пример:

```ini
task_model = opus:high
review_model = sonnet:low
```

Смысл:

- реализация идёт на более сильной модели;
- review выполняется на более дешёвой и быстрой модели.

### 2. Настройки для внешнего Codex-review

Для внешнего ревью через Codex используются отдельные поля:

```ini
codex_model = gpt-5.3-codex-mini
codex_reasoning_effort = low
```

Здесь уже настраивается не Claude-фаза, а именно внешний review executor.

### 3. Практическая логика комбинации

У `ralphex` есть хорошее разделение обязанностей:

- `task_model` влияет на реализацию;
- `review_model` влияет на review/fix loop/finalize;
- `codex_model` и `codex_reasoning_effort` влияют только на внешний review.

Из этого следуют рабочие комбинации:

- дорогая реализация + дешёвое review;
- дешёвая реализация + сильный внешний контроль;
- полностью дешёвый профиль;
- строгий профиль, где дорогие модели используются и на реализации, и на ревью.

## Важное ограничение по wrapper'ам

Если заменить Claude на wrapper `scripts/codex-as-claude/codex-as-claude.sh`, нужно учитывать ограничение текущей реализации:

- wrapper читает prompt из stdin;
- wrapper игнорирует неизвестные флаги;
- `--model` и `--effort`, которые `ralphex` может добавлять к `claude_command`, в текущем wrapper фактически не маппятся в конфиг Codex.

На практике это значит:

- `task_model` и `review_model` удобны для штатного Claude CLI или wrapper'ов, которые реально понимают эти флаги;
- для `codex-as-claude` в текущем виде надёжнее использовать переменные окружения вроде `CODEX_MODEL`;
- отдельная тонкая маршрутизация по `effort` через `task_model` / `review_model` в этом режиме потребует доработки wrapper'а.

## Практические рекомендации

Если цель именно минимизировать токены:

1. Начинать с `--tasks-only`.
2. Делать план мелкими задачами.
3. Если review всё же нужен, сначала добавлять только `--external-only`.
4. Для Codex использовать более дешёвую модель и низкий `reasoning_effort`.
5. Ограничивать `review_patience` и `max_external_iterations`.
6. Не вставлять большие diff'ы вручную в кастомные prompt'ы.

## Готовые профили конфигурации

Ниже три готовых профиля, которые можно положить в `~/.config/ralphex/config` или в локальный `.ralphex/config`.

### Профиль `cheap`

Для минимальной стоимости и минимального расхода токенов. Подходит для рутинных задач, прототипов, черновой реализации и случаев, где дополнительный review не обязателен.

```ini
# cheap
task_model = sonnet:low
review_model = sonnet:low

external_review_tool = none

task_retry_count = 1
max_external_iterations = 0
review_patience = 0

finalize_enabled = false
```

Рекомендуемый запуск:

```bash
ralphex --tasks-only docs/plans/feature.md
```

Сильные стороны:

- минимальное число LLM-вызовов;
- дешёвый execution path;
- хороший вариант для небольших локальных задач.

Ограничения:

- нет независимого внешнего review;
- меньше шанс поймать регрессии сложной логики на поздней стадии.

### Профиль `balanced`

Для повседневной работы. Даёт разумный баланс между ценой, скоростью и качеством проверки.

```ini
# balanced
task_model = sonnet:medium
review_model = sonnet:low

external_review_tool = codex
codex_model = gpt-5.3-codex-mini
codex_reasoning_effort = low
codex_sandbox = read-only

task_retry_count = 1
max_external_iterations = 1
review_patience = 1

finalize_enabled = false
```

Рекомендуемый запуск:

```bash
ralphex docs/plans/feature.md
```

или, если нужен только независимый аудит:

```bash
ralphex --external-only docs/plans/feature.md
```

Сильные стороны:

- реализация остаётся относительно недорогой;
- есть внешний взгляд со стороны;
- ограничены дорогие review-повторы.

Ограничения:

- не максимальная глубина анализа;
- для сложных архитектурных изменений может быть недостаточно.

### Профиль `strict`

Для важных изменений, сложной бизнес-логики, чувствительных интеграций и задач, где цена ошибки выше стоимости токенов.

```ini
# strict
task_model = opus:high
review_model = sonnet:medium

external_review_tool = codex
codex_model = gpt-5.4
codex_reasoning_effort = high
codex_sandbox = read-only

task_retry_count = 2
max_external_iterations = 2
review_patience = 2

finalize_enabled = true
```

Рекомендуемый запуск:

```bash
ralphex docs/plans/feature.md
```

Сильные стороны:

- сильная модель на реализации;
- более серьёзный внешний контроль;
- выше шанс поймать тяжёлые ошибки до завершения работы.

Ограничения:

- самый дорогой профиль;
- больше latency;
- есть риск лишних review-итераций, если проект склонен к ложноположительным замечаниям.

## Как выбирать профиль

Выбор можно свести к простой схеме:

- `cheap` — когда важнее скорость и цена, чем глубина контроля;
- `balanced` — режим по умолчанию для большинства обычных задач;
- `strict` — когда ошибка стоит дороже токенов.

## Источники

- `README.md`
- `llms.txt`
- `docs/custom-providers.md`
- `pkg/config/defaults/config`
- `pkg/config/defaults/prompts/review_first.txt`
- `pkg/config/defaults/prompts/review_second.txt`
- `pkg/config/defaults/prompts/codex.txt`
- `pkg/config/defaults/prompts/codex_review.txt`
- `scripts/codex-as-claude/codex-as-claude.sh`
- `pkg/executor/codex.go`
- `pkg/config/frontmatter.go`
