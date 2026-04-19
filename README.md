# VSCode 文档翻译器 (vscode-doc-translator)

使用 AI 模型（MiniMax、OpenAI 或 OpenAI 兼容接口）将英文 .md 和 .txt 文档翻译为简体中文的 VSCode 扩展。

## 功能特点

- 一键将英文文档翻译为中文
- **原文绝不修改** - 始终保持原文完整
- 智能分块处理长文档
- 翻译结果保存到 `.sy/` 目录
- 保留 Markdown 格式
- 支持配置不同的 AI 模型和 API 端点

## 安装方式

### 方式一：通过 VSIX 文件安装（推荐）

1. 从 [GitHub Releases](https://github.com/ye1su/sy-translate/releases) 页面下载最新的 `.vsix` 文件
2. 在 VSCode 中运行命令 `Extensions: Install from VSIX...`
3. 选择下载的 `.vsix` 文件即可

### 方式二：本地开发安装

1. 克隆本仓库
2. 运行 `npm install`
3. 按 `F5` 在 VSCode 中运行扩展

## 使用方法

1. 打开一个英文 `.md` 或 `.txt` 文件
2. 点击底部状态栏的 **🔄 翻译** 按钮
3. 首次使用需配置 API Key
4. 翻译结果会在新标签页中打开

## 翻译文件存储

翻译后的文件保存在 `.sy/` 目录下，命名规则如下：

| 原文文件 | 翻译文件 |
|---------|---------|
| `src/extension.ts` | `.sy/src.extension.md` |
| `docs/readme.txt` | `.sy/docs.readme.md` |

## 配置选项

点击状态栏的 **🔄 翻译** 项目进行配置：

- **API Key** - 翻译服务的 API 密钥
- **API Endpoint** - OpenAI 兼容的 API 端点
- **Model** - 模型名称（如 `minimax/text-01`）

也可在 VSCode 设置 (JSON) 中配置：

```json
{
  "vscode-doc-translator.apiKey": "your-api-key",
  "vscode-doc-translator.apiEndpoint": "https://api.minimaxi.com/v1",
  "vscode-doc-translator.model": "MiniMax-Text-01"
}
```

## 工作原理

1. **语言检测**：检查文档是否主要为英文
2. **重复检查**：检查 `.sy/` 目录中是否已有翻译
3. **智能分块**：将长文档分割为约 2,500 单词的块
4. **翻译**：将每个块发送到配置的 AI 模型
5. **存储**：将翻译结果保存到 `.sy/` 目录

## 构建发布版本

```bash
# 安装 vsce 工具
npm install -g @vscode/vsce

# 打包扩展
vsce package

# 这会生成 .vsix 文件，可用于安装
```

## 技术栈

- TypeScript 5.x
- VSCode Extension API
- axios (HTTP 客户端)
- crypto-js (SHA-256 哈希)

## License

MIT
