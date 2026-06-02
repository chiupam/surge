// ==UserScript==
// @name         京东自动五星评价
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  自动勾选五星、移除图片上传、填写好评内容
// @author       chiupam
// @match        https://club.jd.com/myJdcomments/orderVoucher*
// @grant        none
// @run-at       document-end
// ==/UserScript==

/**
 * 使用说明：
 * 1. 打开京东评价列表页面：
 *    https://club.jd.com/myJdcomments/myJdcomment.action
 * 2. 在评价列表中，点击任意一条商品后的【评价】按钮
 * 3. 页面会弹出一个新的评价窗口，脚本将自动在该页面中执行以下操作：
 *    - 自动勾选全部五星好评
 *    - 自动移除图片上传区域
 *    - 自动填写默认好评内容
 * 4. 确认无误后手动提交即可
 *
 * @note 脚本仅在匹配的 URL 下运行，请确保不会误触其他页面
 */

(function () {
  'use strict';

    var reviewText = '商品与描述完全一致，发货速度快，非常满意的一次购物体验！';

  function simulateClick(el) {
    ['mousedown', 'mouseup', 'click'].forEach(function (type) {
      var event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      el.dispatchEvent(event);
    });
  }

  function simulateInput(el, value) {
    // React 需要触发原生 setter 才能更新受控组件
    var nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    );
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function clickAllFiveStars() {
    var stars = document.querySelectorAll('.commstar .star5:not(.active)');
    if (stars.length === 0) {
      var unclicked = document.querySelectorAll('.commstar .star5');
      if (unclicked.length === 0) {
        return false;
      }
      stars = unclicked;
    }
    stars.forEach(function (star) {
      simulateClick(star);
    });
    return true;
  }

  function removeThumbnailUploads() {
    var containers = document.querySelectorAll('.thumbnail-list');
    containers.forEach(function (el) {
      el.remove();
    });
  }

  function fillReview() {
    var textarea = document.querySelector('.fop-main .f-textarea textarea');
    if (textarea && textarea.value === '') {
      simulateInput(textarea, reviewText);
    }
  }

  function doWork() {
    clickAllFiveStars();
    removeThumbnailUploads();
    fillReview();
  }

  function observe() {
    var target = document.querySelector('.commstar-group');
    if (target) {
      doWork();
      var attempt = function () {
        var remaining = document.querySelectorAll('.commstar .star5:not(.active)');
        if (remaining.length > 0) {
          clickAllFiveStars();
          setTimeout(attempt, 800);
        }
      };
      attempt();

      var observer = new MutationObserver(function () {
        setTimeout(function () {
          doWork();
        }, 300);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    setTimeout(observe, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(observe, 800);
    });
  } else {
    observe();
  }
})();