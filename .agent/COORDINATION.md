# Agent Coordination Index

Quy trình giao tiếp đã được tách thành hai khu vực:

- `.agents/prompts/ANTIGRAVITY-TASK.md`: task/prompt hiện tại gửi Antigravity.
- `.agents/reports/ANTIGRAVITY-REPORT.md`: báo cáo những gì Antigravity đã thực hiện.
- `.agent/verification/CODEX-CHECKLIST.md`: checklist Codex dùng để kiểm tra.
- `.agent/verification/VERIFICATION-LOG.md`: kết quả nghiệm thu độc lập của Codex.

## Quy Ước

```text
.agents = Antigravity nhận task và báo cáo kết quả
.agent  = Codex kiểm tra và đưa verdict
```

Lịch sử Task 1-9 đã được tóm tắt trong `.agent/verification/VERIFICATION-LOG.md`. Không đánh dấu `VERIFIED` chỉ dựa trên báo cáo của Antigravity; luôn đối chiếu source và kiểm tra thực tế.
