# JavaScript 混淆加密工具

这个目录包含用于混淆 JavaScript 代码的工具脚本 `obfuscator.js`，可以帮助保护您的 JavaScript 代码不被轻易查看或逆向工程。

## 功能特点

- 自动混淆当前目录下的所有 JS 文件（除了混淆器本身）
- 使用专业的 `javascript-obfuscator` 库提供高强度混淆
- 支持多种混淆技术：变量重命名、控制流平坦化、字符串加密等
- 混淆后的文件自动输出到上级目录

## 使用方法

### 1. 安装依赖

首先，确保您已经安装了 Node.js 环境。在该目录下运行以下命令安装必要的依赖：

```bash
npm install javascript-obfuscator
```

### 2. 准备源文件

将需要混淆的 JavaScript 文件放置在当前目录 (`src`) 下。

### 3. 运行混淆脚本

在当前目录下执行：

```bash
node obfuscator.js
```

### 4. 查看结果

混淆后的文件将被保存在上级目录 (`scripts/javascripts/`) 中，文件名与源文件相同。

## 混淆配置说明

当前配置针对 Surge 环境进行了优化，主要参数如下：

```javascript
{
  controlFlowFlattening: true,            // 控制流平坦化
  controlFlowFlatteningThreshold: 0.75,   // 应用平坦化的代码比例
  deadCodeInjection: true,                // 注入无用代码
  deadCodeInjectionThreshold: 0.4,        // 注入代码比例
  identifierNamesGenerator: 'hexadecimal', // 变量名生成方式
  numbersToExpressions: true,             // 将数字转为表达式
  renameGlobals: true,                    // 重命名全局变量
  selfDefending: true,                    // 防止代码被格式化
  stringArray: true,                      // 字符串放入数组
  stringArrayEncoding: ['rc4'],           // 字符串加密方式
  stringArrayThreshold: 0.75,             // 字符串加密比例
  transformObjectKeys: true               // 转换对象键名
}
```

## 注意事项

1. **源文件保护**：源文件已在 `.gitignore` 中设置为不提交，只有 `obfuscator.js` 会被 Git 跟踪
2. **配置调整**：如果混淆后的代码在 Surge 中运行异常，尝试降低混淆强度
3. **调试**：出现问题时，可以尝试关闭 `selfDefending` 和 `renameGlobals` 选项
4. **备份**：首次使用前建议备份原始文件

## 混淆级别调整

如果当前混淆设置对您的脚本兼容性有影响，可以在 `obfuscator.js` 中调整以下参数：

- 降低 `controlFlowFlatteningThreshold` (推荐: 0.3-0.5)
- 降低 `deadCodeInjectionThreshold` (推荐: 0.1-0.3)
- 设置 `renameGlobals: false`
- 设置 `selfDefending: false`
- 将 `stringArrayEncoding` 改为 `['base64']`

## 常见问题

1. **混淆后脚本无法运行**：降低混淆强度，特别是关闭 `renameGlobals` 和 `selfDefending`
2. **特定功能失效**：可能是全局变量被重命名，设置 `renameGlobals: false`
3. **内存占用高**：减少 `stringArrayThreshold` 和 `controlFlowFlatteningThreshold` 的值 