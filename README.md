# AI训练师四级在线模拟考试

这是一个纯前端静态网页，可直接部署到 GitHub Pages。

## 功能
- 题库覆盖：判断题250 + 单选题500（共750题）
- 支持范围切换：
  - 全量题库
  - 仅官方答案题（200题）
  - 仅推断答案题（550题）
- 支持章节刷题：基本要求 / 数据采集和处理 / 数据标注 / 智能系统运维
- 支持模式：
  - 标准模拟（判断50 + 单选150）
  - 自定义题量
  - 只练判断题
  - 只练单选题
- 倒计时交卷、自动判分、错题回顾
- 本地错题本（localStorage）

## 目录结构
- `index.html` 页面入口
- `styles.css` 样式
- `app.js` 逻辑
- `data/question_bank.json` 题库与答案
- `data/full_answer_key.csv` 全量答案键（可核对）
- `data/calibration_report.md` 第二轮校准报告

## 答案来源说明
- 官方答案：200题（判断1-50 + 单选1-150）
- 推断答案：550题（用于训练与复盘）

> 页面会显示每题答案来源与置信度。

## 本地预览
可用任意静态服务器打开目录，例如：

```bash
cd ai-trainer-exam-web
python3 -m http.server 8080
```

然后访问：`http://127.0.0.1:8080`

## 发布到 GitHub Pages（最简）

1. 新建 GitHub 仓库，例如 `ai4-mock-exam`。
2. 将本目录文件上传到仓库根目录。
3. 在 GitHub 仓库设置：
   - `Settings` -> `Pages`
   - `Build and deployment` -> `Source` 选 `Deploy from a branch`
   - 分支选 `main`，目录选 `/ (root)`，保存。
4. 等待 1-2 分钟后，访问生成的网址。

## 建议
- 冲刺阶段优先选择“仅官方答案题”进行正式模拟。
- 全量题库适合刷题和查漏补缺。


## 自动部署（GitHub Actions）
仓库已包含工作流：`/.github/workflows/pages.yml`。

步骤：
1. 将本目录作为仓库根目录推送到 `main` 分支。
2. 在仓库 `Settings -> Pages` 中将 Source 设为 `GitHub Actions`。
3. 每次 push 到 `main` 会自动重新部署。
