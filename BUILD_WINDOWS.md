# 科学记事本 - Windows EXE 构建说明

## GitHub Actions 自动构建

代码已配置 GitHub Actions 自动构建工作流，每次推送到 master 分支时会自动构建 Windows EXE 文件。

### 触发方式：

1. **自动触发** - 推送代码到 master 分支
2. **手动触发** - 在 GitHub Actions 页面手动运行工作流

### 获取构建产物：

1. 打开 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "Build Windows EXE" 工作流
4. 点击最新的运行记录
5. 在 "Artifacts" 部分下载 `scientific-notepad-windows` 文件

### 本地构建（Windows 环境）：

如果你在 Windows 电脑上，可以本地构建：

```bash
# 安装依赖
npm install

# 构建 EXE
npm run tauri:build
```

构建完成后，EXE 文件在 `src-tauri/target/release/bundle/nsis/` 目录下。

## 系统要求

- Windows 10 或更高版本
- 支持的架构：x64

## 功能特性

- 文本编辑与自动保存
- 行内计算（输入表达式后按 = 号计算）
- 科学计算函数（三角函数、对数、指数等）
- 图片粘贴功能
- 窗口透明度调节
- 字体大小调节
- 置顶显示
- 深色/浅色模式

## 使用方法

1. 下载并解压 EXE 文件
2. 双击运行安装程序
3. 按照安装向导完成安装
4. 启动应用即可使用

## 数据存储

应用数据自动保存在：
```
%APPDATA%\com.scientific-notepad.app
```

## 开发者信息

如有问题或建议，请在 GitHub Issues 中反馈。
