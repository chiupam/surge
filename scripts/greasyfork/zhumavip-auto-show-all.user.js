// ==UserScript==
// @name         竹马法考助手
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动展开文字解析、键盘方向键快捷切换题目（←上一题，→下一题）
// @author       chiupam
// @match        https://www.zhumavip.com/obt/analysis?questionTypeId*
// @icon         https://www.zhumavip.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function clickShowAll() {
        // 以稳定的 #ptxt 为锚点，在其父容器内查找文本为"查看全部"的按钮
        const ptxt = document.querySelector('#ptxt');
        if (!ptxt) return false;

        const parent = ptxt.parentElement;
        if (!parent) return false;

        // 在父容器内查找所有子元素，匹配文本"查看全部"
        const children = parent.querySelectorAll('*');
        for (const el of children) {
            if (el.textContent.trim() === '查看全部') {
                el.click();
                console.log('[竹马法考] 已自动点击"查看全部"');
                return true;
            }
        }
        return false;
    }

    // 键盘导航：←上一题，→下一题
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        if (e.key === 'ArrowLeft') {
            const prevBtn = findBtnByText('上一题');
            if (prevBtn) {
                prevBtn.click();
                console.log('[竹马法考] 键盘导航 → 上一题');
            }
        } else if (e.key === 'ArrowRight') {
            const nextBtn = findBtnByText('下一题');
            if (nextBtn) {
                nextBtn.click();
                console.log('[竹马法考] 键盘导航 → 下一题');
            }
        }
    });

    function findBtnByText(text) {
        // 优先查精确匹配"上一题"/"下一题"文本的div元素
        const all = document.querySelectorAll('div');
        for (const el of all) {
            const t = el.textContent.trim();
            // 精确匹配，避免匹配到包含该文本的其他元素
            if (t === text && el.childElementCount <= 1) {
                return el;
            }
        }
        return null;
    }

    // 每秒轮询一次，持续运行
    setInterval(clickShowAll, 1000);
})();
