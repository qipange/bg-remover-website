# 智能图片背景去除网站

这是一个完全在浏览器中运行的图片背景去除工具，无需上传图片到服务器，保护用户隐私。

## 🚀 功能特性

- **拖拽上传**：支持拖拽图片到指定区域上传
- **多种格式**：支持 PNG、JPG、JPEG、WebP 格式
- **实时预览**：上传后立即显示原图和结果图
- **多种下载格式**：可下载为 PNG、JPG、WebP 格式
- **完全离线**：支持 PWA，可安装为桌面应用
- **响应式设计**：适配手机、平板和桌面设备
- **隐私保护**：所有处理都在浏览器中进行，不上传服务器

## 📁 项目结构

```
bg-remover-website/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── script.js      # 主脚本文件
├── images/
│   └── placeholder.png # 占位图片
├── service-worker.js   # 服务工作者文件
└── README.md          # 项目说明
```

## 🔧 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式设计（Flexbox、Grid、动画）
- **JavaScript** - 交互逻辑
- **Canvas API** - 图片处理
- **Service Worker** - 离线缓存
- **PWA** - 渐进式Web应用
- **Font Awesome** - 图标库
- **Google Fonts** - 字体

## 🎯 使用方法

### 1. 上传图片
- 点击上传区域选择文件
- 或将图片拖拽到上传区域
- 支持 PNG、JPG、JPEG、WebP 格式（最大 10MB）

### 2. 去除背景
- 点击"去除背景"按钮
- 等待几秒钟处理完成
- 查看实时预览结果

### 3. 下载图片
- 选择下载格式（PNG、JPG、WebP）
- 点击"下载结果图"按钮
- 图片将自动下载到本地

## ⌨️ 快捷键

- `Ctrl + O` - 打开文件选择器
- `Ctrl + P` - 处理图片（去除背景）
- `Ctrl + D` - 下载处理后的图片
- `Escape` - 重置所有内容

## 🌐 部署方式

### 本地运行
```bash
# 使用 Python 简单服务器
python3 -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server
```

### 静态托管服务
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- 任何支持静态文件的Web服务器

## 📱 PWA 功能

网站支持 PWA（渐进式Web应用），可以：

1. **离线使用** - 缓存核心文件，无网络时仍可使用
2. **添加到主屏幕** - 在手机/电脑上像原生应用一样使用
3. **推送通知** - 支持浏览器推送（未来扩展）

## 🧪 背景去除算法

当前版本使用简单的颜色阈值算法作为演示：

1. **颜色分析** - 检测接近白色的区域
2. **透明度处理** - 将背景区域设为透明
3. **边缘优化** - 平滑处理边缘过渡

**注意**：实际生产环境建议使用以下方案：
- [remove.bg](https://www.remove.bg/) API
- [rembg](https://github.com/danielgatis/rembg) Python库
- TensorFlow.js 机器学习模型

## 📄 许可证

MIT License - 自由使用和修改

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📞 支持与反馈

如有问题或建议，请：
1. 查看 Issues 页面
2. 提交新的 Issue
3. 或直接联系维护者

## 🔮 未来计划

- [ ] 集成真正的 AI 背景去除算法
- [ ] 添加批量处理功能
- [ ] 支持更多图片编辑功能
- [ ] 添加历史记录功能
- [ ] 云同步支持
- [ ] 社交分享功能

---

**享受去除图片背景的乐趣！** 🎨✨