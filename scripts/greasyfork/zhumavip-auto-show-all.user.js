// ==UserScript==
// @name         竹马法考自动展开解析
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动点击竹马法考文字解析页面的"查看全部"按钮，展开完整解析内容
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

    // 每秒轮询一次，持续运行
    setInterval(clickShowAll, 1000);
})();
