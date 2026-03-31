# MEGWIN軍団 RPG風募集フォーム - 引き継ぎドキュメント

**作成日**: 2026-03-31
**作成元**: claude.ai チャット
**引き継ぎ先**: Claude Code

---

## 1. プロジェクト概要

YouTube登録者100万人・再生100万回を目指して「新MEGWIN軍団」を募集するためのWebフォーム。
普通のGoogleフォームではなく、**レトロ8bit RPG風のインタラクティブな応募フォーム**として構築。

### コンセプト
- ギルドマスターMEGWINが語りかけるタイプライター演出
- 職業選択（戦士＝演者 / 魔導士＝エンジニア）でルート分岐
- ファミコン風UI（DotGothic16 + Press Start 2Pフォント、スキャンライン、星空背景）
- 8bit効果音（Web Audio API）
- 完了時にピクセル紙吹雪＋ファンファーレ

---

## 2. 現在の状態

### 完了済み
- [x] RPGフォームのHTML/CSS/JS（単一HTMLファイル）
- [x] Supabaseテーブル `gundan_applications` 作成済み
- [x] RLSポリシー設定済み（anon INSERT可、anon/authenticated SELECT可）
- [x] 2ルート分岐（戦士/魔導士）実装済み
- [x] Supabaseへのデータ保存機能実装済み

### 未実装（TODO）
- [ ] **メール通知**: 応募があったら `megwintv@gmail.com` に通知を送る（Supabase Edge Function or Webhook推奨）
- [ ] **Vercelへのデプロイ**: 公開用にデプロイ（megwin.com のサブドメインに置く案あり）
- [ ] **管理画面**: 応募一覧を見るページ（パスワード保護付き）
- [ ] **レスポンシブの微調整**: スマホでの操作性確認

---

## 3. 技術構成

### フロントエンド
- **単一HTMLファイル**（`index.html`）
- バニラJS（フレームワークなし）
- フォント: Google Fonts（DotGothic16 + Press Start 2P）
- 効果音: Web Audio API（ビープ音のみ、外部ファイル不要）

### バックエンド
- **Supabase**（既存プロジェクト）
  - Project ID: `ogyhlldqkjhwscgvrszu`
  - URL: `https://ogyhlldqkjhwscgvrszu.supabase.co`
  - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9neWhsbGRxa2pod3NjZ3Zyc3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NjcxNTAsImV4cCI6MjA1NTQ0MzE1MH0.o_jzOocePT58R_Bfwr2IBAJ6tqIKYjsi1sERVBR5bgs`

### デプロイ先（予定）
- Vercel（megwin.com関連ドメイン）

---

## 4. Supabase テーブル定義

### テーブル: `public.gundan_applications`

| カラム名 | 型 | NULL可 | 説明 |
|---|---|---|---|
| id | bigint (SERIAL) | NO | 主キー |
| name | text | NO | 冒険者名（活動名） |
| email | text | NO | メールアドレス |
| age | text | YES | 年齢 |
| location | text | YES | 活動拠点 |
| job_class | text | NO | 職業コード（`warrior` / `mage`） |
| job_class_label | text | YES | 職業ラベル（「戦士（演者）」/「魔導士（エンジニア）」） |
| stream_platforms | jsonb | YES | 配信経験プラットフォーム（配列）※戦士のみ |
| genres | jsonb | YES | 得意ジャンル（配列）※戦士のみ |
| weekly_hours | text | YES | 活動頻度（戦士） |
| face_reveal | text | YES | 顔出し可否（戦士のみ） |
| channel_url | text | YES | チャンネル/SNS URL（戦士のみ） |
| languages | jsonb | YES | 使える言語・技術（配列）※魔導士のみ |
| hardware_exp | jsonb | YES | ハードウェア経験（配列）※魔導士のみ |
| ai_tools | jsonb | YES | 使用中のAIツール（配列）※魔導士のみ |
| ai_monthly_cost | text | YES | AI月額課金額※魔導士のみ |
| github_url | text | YES | GitHub/ポートフォリオURL（魔導士のみ） |
| weekly_hours_mage | text | YES | 活動頻度（魔導士） |
| pr_warrior | text | YES | 自己PR（戦士） |
| pr_mage | text | YES | 自己PR（魔導士） |
| agency_status | text | YES | 事務所/MCN所属状況 |
| applied_at | timestamptz | YES | 応募日時 |
| created_at | timestamptz | YES | レコード作成日時（DEFAULT NOW()） |

### RLSポリシー
- `Anyone can insert applications` → anon で INSERT 可（WITH CHECK: true）
- `Anon can view applications` → anon で SELECT 可（USING: true）
- `Authenticated users can view applications` → authenticated で SELECT 可（USING: true）

---

## 5. フォームの画面フロー

```
[タイトル画面] PRESS START
    ↓
[ステージ1] 冒険者登録
  - 名前（必須）
  - メールアドレス（必須）
  - 年齢
  - 活動拠点
    ↓
[ステージ2] 職業選択
  - ⚔️ 戦士の道（演者・配信者）
  - 📖 魔導士の道（エンジニア・裏方）
    ↓                    ↓
[ステージ3]          [ステージ4]
戦士ルート            魔導士ルート
- 配信経験PF           - 言語・技術
- 得意ジャンル          - ハードウェア経験
  (MEGWIN含む)         - 使用中のAI
- 週活動頻度           - AI月額課金
- 顔出し可否           - 週活動頻度
- チャンネルURL         - GitHub URL
- 自己PR              - 自己PR
    ↓                    ↓
[ステージ5] 最終確認（共通）
  - 事務所/MCN所属確認
  - 冒険の書（回答サマリー表示）
  - 「記録する！」→ Supabase INSERT
    ↓
[ステージ6] 完了画面
  - ファンファーレ＋紙吹雪
  - MEGWINからのメッセージ
```

---

## 6. 選択肢一覧

### 戦士ルート

**配信経験プラットフォーム**（複数選択）:
YouTube / Twitch / TikTok Live / ニコニコ / 未経験（これから始めたい！）

**得意ジャンル**（複数選択）:
トーク・雑談 / 企画・チャレンジ / ゲーム実況 / 料理 / 音楽・歌 / MEGWIN / その他

**週活動頻度**: 週1〜2日 / 週3〜4日 / ほぼ毎日

**顔出し**: OK / NG（声のみ・アバター等） / 相談して決めたい

### 魔導士ルート

**言語・技術**（複数選択）:
Python / JavaScript・TypeScript / C・C++ / HTML・CSS / React・Next.js / その他

**ハードウェア経験**（複数選択）:
ESP32・ESP8266 / Raspberry Pi / Arduino / 電子工作全般 / 未経験（ソフトウェアのみ）

**使用中のAI**（複数選択）:
ChatGPT / Claude / Gemini / GitHub Copilot / Cursor / その他 / 使っていない

**AI月額課金**: 0円（無料のみ） / 〜3,000円 / 3,000〜10,000円 / 10,000円以上（ガチ勢）

**週活動頻度**: 週1〜2日 / 週3〜4日 / ほぼ毎日

### 共通（最終確認）

**事務所/MCN所属**: 所属なし（フリー） / 所属あり（要相談）

---

## 7. 残タスク詳細

### 7-1. メール通知
応募が入ったら `megwintv@gmail.com` にメールを送る。

**推奨実装案**: Supabase Edge Function
- `gundan_applications` へのINSERT をトリガーにする
- Database Webhook → Edge Function → メール送信（Resend or SendGrid）
- メール内容: 応募者名、職業、連絡先、自己PR要約

### 7-2. Vercelデプロイ
- 単一HTMLファイルなのでそのまま `vercel deploy` で公開可能
- ドメイン案: `gundan.megwin.com` or `recruit.gimmickstream.com` など

### 7-3. 管理画面
- 応募一覧をテーブル表示
- パスワード保護（既存TODO管理画面と同じ `3bdcaa166c66` or 別パスワード）
- フィルタ機能（戦士/魔導士別、日付順ソートなど）
- CSV/Excel エクスポート機能があると便利

---

## 8. ファイル構成

現時点では単一ファイル:

```
megwin-rpg-form/
  └── index.html    ← RPGフォーム本体（HTML+CSS+JS全部入り）
```

Claude Code で作業する際は、このHTMLファイルをベースにして残タスクを進めてください。

---

## 9. 注意事項

- Supabaseの既存プロジェクト（`ogyhlldqkjhwscgvrszu`）には `todos` テーブルも入っているので、マイグレーション時は既存テーブルに影響を与えないよう注意
- フォームのAnon Keyはフロントエンドに露出しているが、RLSでINSERTとSELECTのみ許可しているので問題なし
- 将来的にDELETEやUPDATEのポリシーが必要になった場合は、authenticatedロール限定で追加すること
