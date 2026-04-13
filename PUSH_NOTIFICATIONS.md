# Push通知（告知）の使い方

MEGWIN公式サイトの購読者にWeb Push通知を送る仕組み。Discord `/push` コマンドから操作する。

## 仕組みの全体像

```
[Discord #告知 で /push]
   ↓ HTTPS署名検証
[Vercel API /api/discord]
   ↓
[Supabase に予約 or 即送信]
   ↓ web-push (即時) または pg_cron (1分毎チェック)
📱 全購読者のスマホ／PCに通知ポップ
   ↓ タップ
🎬 指定URL（YouTubeライブ等）が開く
```

ローカルPC不要、完全クラウド完結。

---

## コマンド一覧

すべて `#告知` チャンネルで実行。返信はMEGWINさんだけに見える（ephemeral）。

### `/push` — 通知送信
| パラメータ | 必須 | 説明 |
|----------|:-:|------|
| `title` | ✅ | 通知のタイトル |
| `body` | ✅ | 本文 |
| `url` | | タップで開くURL（省略時はサイトTOP） |
| `at` | | 予約時刻（省略時は即時送信） |

#### 即時送信の例
```
/push title:ライブ始まったぜ body:今日はぶどう剪定回 url:https://youtube.com/live/XXX
```

#### 予約送信の例
```
/push at:30分後 title:あと30分で配信 body:お楽しみに
/push at:今日20:00 title:今夜20時から body:準備OK
/push at:明日9:30 title:明日朝の告知 body:見逃さないで
/push at:2026-04-15 18:00 title:特番予告 body:詳細は後日
```

#### `at` の対応フォーマット
- `30分後`、`2時間後`
- `今日20:00`、`明日9:30`、`明後日12:00`
- `2026-04-15 18:00`（JST）

### `/push-list` — 予約一覧
未送信の予約を時刻順に最大20件表示。
```
/push-list
```

### `/push-cancel` — 予約キャンセル
`/push-list` で確認したIDで指定。
```
/push-cancel id:3
```

### `/push-stats` — 統計表示
```
/push-stats
→ 👥 購読者: N人
→ 📅 予約待ち: N件
→ 📨 直近送信: タイトル (時刻) — 成功/総数
```

---

## 通知が届く仕組み

### 購読の登録（ユーザー側）
1. https://megwin.com を開く
2. **iPhone** → 共有ボタン → 「ホーム画面に追加」 → ホーム画面のアイコンから起動（必須）
3. **Android/PC** → そのままでもOK（Androidは「アプリをインストール」推奨）
4. フッターまでスクロール
5. **🔔 通知を受け取る** → 通知許可
6. ボタンが **🔕 通知OFFにする** になれば購読完了

### 新規購読時の通知
誰かが購読すると `#購読ログ` に自動投稿：
```
🆕 新しい購読者MAJIDE
デバイス: iPhone / Safari
合計: 3人
```

### 通知タップ後の挙動
- `url` に YouTube URL → **YouTubeアプリ直起動**
- `url` にサイト内URL → **PWA/ブラウザでサイト表示**
- `url` 省略 → サイトTOP

---

## 認可（権限）

`/push` 系コマンドは以下のチェックを通った場合のみ実行：

- **チャンネル制限**: `#告知` チャンネル内のみ実行可
- **ユーザー制限**: MEGWINさんのDiscord ID のみ実行可

権限ないと「⚠️ 権限ないぜMAJIDE」と返信される。

---

## トラブル時

### 通知が届かない
1. `/push-stats` で購読者数確認
2. ユーザー側でPWAアプリを起動 → ボタンが「🔕 通知OFFにする」になってるか
3. OSの通知許可設定確認

### 予約が発火しない
- pg_cron は1分毎に動く（最大1分の遅延あり）
- Supabase上の `scheduled_pushes` テーブルで `sent_at` が NULL のままなら未送信
- `/push-list` でも確認可能

### 購読者数が増えない
- Service Worker のキャッシュが残ってる可能性
- ユーザー側でPWAアプリのキャッシュクリア → 再購読

---

## 技術的な構成

### 主要ファイル
- `src/app/api/discord/route.ts` — Slash Commandハンドラ（Ed25519署名検証）
- `src/app/api/push/subscribe/route.ts` — 購読登録/解除API
- `src/app/api/push/send/route.ts` — 内部送信API（cron用）
- `src/app/api/cron/process-scheduled/route.ts` — 予約処理エンドポイント
- `src/lib/push.ts` — `web-push` でVAPID送信
- `src/lib/discord-log.ts` — Webhook通知ヘルパー
- `src/components/pwa/NotificationButton.tsx` — フッターのON/OFFボタン
- `public/sw.js` — Service Worker（push受信・通知タップ処理）
- `public/manifest.json` — PWAマニフェスト

### Supabaseテーブル
- `push_subscriptions` — 購読者の endpoint / 暗号化鍵
- `scheduled_pushes` — 予約キュー

### Supabase pg_cron
- ジョブ名: `process_scheduled_pushes`
- スケジュール: `* * * * *`（毎分）
- 動作: `/api/cron/process-scheduled` を POST 呼び出し

### 環境変数（Vercel）
| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push公開鍵 |
| `VAPID_PRIVATE_KEY` | Web Push秘密鍵 |
| `VAPID_SUBJECT` | VAPID連絡先 |
| `DISCORD_PUBLIC_KEY` | Slash Command署名検証 |
| `DISCORD_BOT_TOKEN` | Slash Command登録用 |
| `DISCORD_APP_ID` | Discord App ID |
| `DISCORD_ALLOWED_CHANNEL_ID` | `/push` 実行可能チャンネル |
| `DISCORD_ALLOWED_USER_IDS` | `/push` 実行可能ユーザー（カンマ区切り） |
| `DISCORD_LOG_WEBHOOK_URL` | `#購読ログ` のWebhook URL |
| `PUSH_SEND_SECRET` | 内部API認証用 |

### Discord Interactions Endpoint
```
https://tomato-megwintv-4398s-projects.vercel.app/api/discord
```
（megwin.comドメイン直は使ってない。HSTSキャッシュ問題を避けるためVercel生URLを使用）

---

## メンテナンス

### Slash Command を変更したとき
```bash
node --env-file=.env.local scripts/register-discord-commands.mjs
```

### pg_cron ジョブの確認
```sql
SELECT jobid, jobname, schedule, active FROM cron.job;
```

### 全購読者リスト確認
```sql
SELECT id, created_at, user_agent FROM push_subscriptions ORDER BY id;
```
