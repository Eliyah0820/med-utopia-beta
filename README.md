# 医学理想国 Med-Utopia Beta

医学理想国的静态内测交互版，用于演示提交病例、学术挂号、技术悬赏和内测申请流程。

## 线上地址

https://jade-smakager-71d6f7.netlify.app/

## 部署

这是一个纯静态网站，可以直接部署到 Netlify、Cloudflare Pages、GitHub Pages 或 Vercel。

Netlify 部署时会识别页面内的 Netlify Forms：

- `case-submission`
- `consult-booking`
- `bounty-task`
- `beta-waitlist`

## 文件

- `index.html`：页面结构和隐藏的 Netlify Forms 定义
- `styles.css`：响应式界面样式
- `app.js`：内测表单交互、本地记录、Netlify Forms 提交逻辑
- `assets/`：页面视觉素材
