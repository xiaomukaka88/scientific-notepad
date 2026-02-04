import './styles.css';

interface AppState {
  text: string;
  fontSize: number;
  opacity: number;
  alwaysOnTop: boolean;
  darkMode: boolean;
}

class App {
  private state: AppState;
  private lastProcessedLine = '';

  constructor() {
    this.state = this.loadState();
    this.render();
  }

  private loadState(): AppState {
    const saved = localStorage.getItem('appState');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      text: '',
      fontSize: 16,
      opacity: 100,
      alwaysOnTop: false,
      darkMode: false
    };
  }

  private saveState() {
    localStorage.setItem('appState', JSON.stringify(this.state));
  }

  setOpacity(value: number) {
    this.state.opacity = value;
    this.saveState();
    // Tauri v2 does not support set_opacity, using CSS instead
    const app = document.querySelector('.container') as HTMLElement;
    if (app) {
      app.style.opacity = (value / 100).toString();
    }
  }

  setAlwaysOnTop(value: boolean) {
    this.state.alwaysOnTop = value;
    this.saveState();
    this.invokeTauriCommand('set_always_on_top', { alwaysOnTop: value });
  }

  async invokeTauriCommand(cmd: string, args: any) {
    if (window.__TAURI__?.invoke) {
      return await window.__TAURI__.invoke(cmd, args);
    }
  }

  render() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="container ${this.state.darkMode ? 'dark' : ''}">
        <header class="toolbar">
          <div class="toolbar-group">
            <button id="btnNew" class="toolbar-btn">新建</button>
            <button id="btnOpen" class="toolbar-btn">打开</button>
            <button id="btnSave" class="toolbar-btn">保存</button>
            <button id="btnSaveAs" class="toolbar-btn">另存为</button>
          </div>
          <div class="toolbar-group">
            <button id="btnDarkMode" class="toolbar-btn">
              ${this.state.darkMode ? '☀️' : '🌙'}
            </button>
            <button id="btnAlwaysOnTop" class="toolbar-btn ${this.state.alwaysOnTop ? 'active' : ''}">
              📌
            </button>
          </div>
          <div class="toolbar-group">
            <label class="toolbar-label">字体: ${this.state.fontSize}px</label>
            <input type="range" id="fontSize" min="10" max="32" value="${this.state.fontSize}" class="toolbar-slider" />
          </div>
          <div class="toolbar-group">
            <label class="toolbar-label">透明度: ${this.state.opacity}%</label>
            <input type="range" id="opacity" min="20" max="100" value="${this.state.opacity}" class="toolbar-slider" />
          </div>
        </header>

        <div class="main-content">
          <div class="editor-full">
            <textarea
              id="editor"
              class="editor"
              placeholder="在此输入文字...&#10;支持行内计算，例如：1+2=&#10;或者：(10+5)*2="
              style="font-size: ${this.state.fontSize}px"
            >${this.state.text}</textarea>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents() {
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    const fontSize = document.getElementById('fontSize') as HTMLInputElement;
    const opacity = document.getElementById('opacity') as HTMLInputElement;

    editor.addEventListener('input', () => {
      const cursorPos = editor.selectionStart;
      const text = editor.value;

      this.state.text = text;
      this.saveState();

      const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
      const lineEnd = text.indexOf('\n', cursorPos);
      const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

      if (currentLine.includes('=') && currentLine !== this.lastProcessedLine) {
        const eqPos = currentLine.indexOf('=');
        const expression = currentLine.substring(0, eqPos).trim();

        if (expression) {
          this.lastProcessedLine = currentLine;
          try {
            const result = this.evaluateExpression(expression);
            const resultStr = result.toString();
            const before = text.substring(0, lineStart + eqPos + 1);
            const after = text.substring(lineEnd === -1 ? text.length : lineEnd);

            const newText = before + resultStr + after;
            editor.value = newText;
            editor.selectionStart = editor.selectionEnd = lineStart + eqPos + 1 + resultStr.length;

            this.state.text = newText;
            this.saveState();
          } catch (error) {
            console.error('计算错误:', error);
          }
        }
      }
    });

    fontSize.addEventListener('input', () => {
      this.state.fontSize = parseInt(fontSize.value);
      editor.style.fontSize = `${this.state.fontSize}px`;
      this.saveState();
      document.querySelector('.toolbar-label')!.textContent = `字体: ${this.state.fontSize}px`;
    });

    opacity.addEventListener('input', () => {
      this.state.opacity = parseInt(opacity.value);
      this.saveState();
      this.setOpacity(this.state.opacity);
      const labels = document.querySelectorAll('.toolbar-label');
      labels[1].textContent = `透明度: ${this.state.opacity}%`;
    });

    document.getElementById('btnDarkMode')?.addEventListener('click', () => {
      this.state.darkMode = !this.state.darkMode;
      this.saveState();
      this.render();
    });

    document.getElementById('btnAlwaysOnTop')?.addEventListener('click', () => {
      this.state.alwaysOnTop = !this.state.alwaysOnTop;
      this.saveState();
      this.setAlwaysOnTop(this.state.alwaysOnTop);
      this.render();
    });

    editor.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let item of items) {
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              this.handleImagePaste(blob);
            }
          }
        }
      }
    });
  }

  private evaluateExpression(expr: string): number {
    const processed = expr
      .replace(/\^/g, '**')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/asin\(/g, 'Math.asin(')
      .replace(/acos\(/g, 'Math.acos(')
      .replace(/atan\(/g, 'Math.atan(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/exp\(/g, 'Math.exp(');

    const result = Function('"use strict"; return (' + processed + ')')();

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('无效的结果');
    }

    return result;
  }

  private handleImagePaste(blob: Blob) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const editor = document.getElementById('editor') as HTMLTextAreaElement;
      const insertPos = editor.selectionStart;
      const before = editor.value.substring(0, insertPos);
      const after = editor.value.substring(editor.selectionEnd);

      editor.value = before + `\n[图片: ${dataUrl.slice(0, 50)}...]\n` + after;
      this.state.text = editor.value;
      this.saveState();
    };
    reader.readAsDataURL(blob);
  }
}

new App();
