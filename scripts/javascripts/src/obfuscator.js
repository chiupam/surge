const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const srcDir = path.join(__dirname);
const distDir = path.resolve(__dirname, '..');

// 创建输出目录（如果不存在）
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
  const fullPath = path.join(srcDir, file);
  const stat = fs.statSync(fullPath);

  // 排除目录和自身 obfuscator.js
  if (
    stat.isFile() &&
    path.extname(file) === '.js' &&
    file !== 'obfuscator.js'
  ) {
    const code = fs.readFileSync(fullPath, 'utf-8');

    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,

      deadCodeInjection: true, // 注入无用代码干扰还原
      deadCodeInjectionThreshold: 0.4,
      identifierNamesGenerator: 'hexadecimal', // 用十六进制命名变量
      numbersToExpressions: true,
      renameGlobals: true, // 甚至全局变量也重命名（慎用）
      selfDefending: true, // 防止代码被格式化

      numbersToExpressions: true,
      simplify: true,
      stringArray: true,
      stringArrayEncoding: ['rc4'],
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    }).getObfuscatedCode();

    const outputFilePath = path.join(distDir, file);
    fs.writeFileSync(outputFilePath, obfuscatedCode, 'utf-8');
    console.log(`✔️ 已混淆：${file}`);
  }
});