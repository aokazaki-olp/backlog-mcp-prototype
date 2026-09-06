# borrowed

参照目的で置いているもの。**スキルとして登録しない。**

- パスを `.claude/skills/` / `.agents/skills/` にしていないのは、置いた瞬間に
  スキルとして自動検出されるのを避けるため。

| ファイル | 出自 | 備考 |
|---|---|---|
| `multi-angle-review.SKILL.md` | **借りもの**。`n8n-nodes-lazytemplate/.agents/skills/multi-angle-review/SKILL.md` | 実験的・未安定。スキル自身が「育てる前提」と明記。取り込み判断は保留 |
| `multi-angle-review.指摘修正のあり方.md` | **自作ドラフト**（借用元には無い） | 上記スキルが定めていない「採ると決めた指摘をどう成果物に落とすか」を補う。スキル本体へ統合するか別スキルに切るかは未定 |

## 2つの関係

```
multi-angle-review.SKILL.md          どの指摘を採るか（recall → precision）
                                      … 統合 (consolidation) まで
multi-angle-review.指摘修正のあり方.md  採ると決めた指摘をどう落とすか
                                      … 理解 → 調査 → 整合性 → 方針確定 → 修正
```

スキル本体は適用段階を定めていないため、そこでトレッドミル（同じ指摘の再生産）が起きうる。
補遺はその経路を塞ぐことだけを目的にしている。
