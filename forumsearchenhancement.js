// Generated by CoffeeScript 1.6.3
/*
// ==UserScript==
// @name        AnimeBytes - Forum Search - Enhancement
// @namespace   Megure@AnimeBytes.tv
// @description Load posts into search results; highlight search terms; filter authors; slide through posts
// @include     http*://animebytes.tv/forums.php*
// @exclude	*action=viewthread*
// @version     0.7
// @grant       GM_getValue
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==
*/


(function() {
  var a, allResults, background_color, button, cb, filterPost, forumIds, forumid, getFirstTagParent, hideSubSelection, input, linkbox1, loadPost, loadText, loadThreadPage, loadingText, myCell, myLINK, newCheckbox, newLinkBox, patt, processThreadPage, quickLink, quickLinkSubs, result, sR, searchForums, searchForumsCB, searchForumsNew, showFastSearchLinks, showPost, strong, tP, textReplace, text_color, toggleText, toggleVisibility, user_filter, user_td, user_tr, workInForumSearch, workInRestOfForum, _i, _len;

  background_color = GM_getValue('ABForumSearchHighlightBG', '#FFC000');

  text_color = GM_getValue('ABForumSearchHighlightFG', '#000000');

  toggleText = GM_getValue('ABForumToggleText', '(Toggle)');

  loadText = GM_getValue('ABForumLoadText', '(Load)');

  loadingText = GM_getValue('ABForumLoadingText', '(Loading)');

  hideSubSelection = GM_getValue('ABForumSearchHideSubfor', 'true') === 'true';

  workInForumSearch = GM_getValue('ABForumSearchWorkInFS', 'true') === 'true' && document.URL.indexOf('action=search') >= 0;

  workInRestOfForum = GM_getValue('ABForumEnhWorkInRest', 'true') === 'true' && (document.URL.indexOf('action=viewforum') >= 0 || document.URL.indexOf('?') === -1);

  showFastSearchLinks = GM_getValue('ABForumEnhFastSearch', 'true') === 'true' && document.URL.indexOf('action=viewforum') >= 0;

  user_filter = [];

  sR = [];

  tP = [];

  cb = [];

  getFirstTagParent = function(elem, tag) {
    while (elem !== null && elem.tagName !== 'BODY' && elem.tagName !== tag) {
      elem = elem.parentNode;
    }
    if (elem.tagName === tag) {
      return elem;
    } else {
      return null;
    }
  };

  textReplace = function(elem) {
    var node, regExp, walk;
    if (patt !== '' && (background_color !== '' || text_color !== '')) {
      walk = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false);
      node = walk.nextNode();
      regExp = new RegExp('(' + patt + ')', 'i');
      while (node != null) {
        node.textContent.replace(regExp, function(term) {
          var args, newSpan, newTextNode, offset;
          args = [].slice.call(arguments);
          offset = args[args.length - 2];
          newTextNode = node.splitText(offset);
          newTextNode.textContent = newTextNode.textContent.substr(term.length);
          newSpan = document.createElement('span');
          if (background_color !== '') {
            newSpan.style.backgroundColor = background_color;
          }
          if (text_color !== '') {
            newSpan.style.color = text_color;
          }
          newSpan.appendChild(document.createTextNode(term));
          node.parentNode.insertBefore(newSpan, newTextNode);
          return node = walk.nextNode();
        });
        node = walk.nextNode();
      }
    }
  };

  processThreadPage = function(id, threadid, page, parent, link) {
    return function() {
      var cell, linkbox, myColsp, nextPost, pagenums, post, prevPost, td, threadPage, tr, user_id, _i, _j, _k, _len, _len1, _ref, _ref1;
      threadPage = "threadid=" + threadid + "&page=" + page;
      link.textContent = toggleText;
      sR[id] = [];
      sR[id].parent = parent;
      sR[id].index = 0;
      sR[id].page = page;
      sR[id].threadid = threadid;
      _ref = tP[threadPage];
      for (_i = _j = 0, _len = _ref.length; _j < _len; _i = ++_j) {
        post = _ref[_i];
        if (post.id === id) {
          sR[id].index = _i;
        }
      }
      user_id = tP[threadPage][sR[id].index].className.split('_');
      user_id = user_id[user_id.length - 1];
      sR[id].user = tP[threadPage][sR[id].index].querySelector('a[href="/user.php?id=' + user_id + '"]').textContent;
      linkbox = document.createElement('div');
      pagenums = document.createElement('div');
      linkbox.className = 'linkbox';
      pagenums.className = 'pagenums';
      prevPost = document.createElement('a');
      nextPost = document.createElement('a');
      prevPost.href = '#';
      nextPost.href = '#';
      prevPost.className = 'page-link';
      nextPost.className = 'page-link';
      prevPost.textContent = '← Prev';
      nextPost.textContent = 'Next →';
      pagenums.appendChild(prevPost);
      pagenums.appendChild(nextPost);
      linkbox.appendChild(pagenums);
      prevPost.addEventListener('click', showPost(sR[id], true), true);
      nextPost.addEventListener('click', showPost(sR[id], false), true);
      tr = document.createElement('tr');
      td = document.createElement('td');
      myColsp = 0;
      _ref1 = parent.cells;
      for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
        cell = _ref1[_k];
        myColsp += cell.colSpan;
      }
      td.colSpan = myColsp;
      td.appendChild(linkbox);
      td.appendChild(tP[threadPage][sR[id].index]);
      tr.appendChild(td);
      sR[id].td = td;
      return sR[id].parent.parentNode.insertBefore(tr, sR[id].parent.nextSibling);
    };
  };

  loadThreadPage = function(threadid, page) {
    var threadPage, xhr;
    threadPage = "threadid=" + threadid + "&page=" + page;
    tP[threadPage] = 'Loading';
    cb[threadPage] = [];
    xhr = new XMLHttpRequest();
    xhr.open('GET', "https://animebytes.tv/forums.php?action=viewthread&" + threadPage, true);
    xhr.send();
    return xhr.onreadystatechange = function() {
      var callback, parser, post, _i, _j, _len, _len1, _ref, _ref1;
      if (xhr.readyState === 4) {
        parser = new DOMParser();
        tP[threadPage] = (parser.parseFromString(xhr.responseText, 'text/html')).querySelectorAll('div[id^="post"]');
        _ref = tP[threadPage];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          post = _ref[_i];
          textReplace(post);
        }
        _ref1 = cb[threadPage];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          callback = _ref1[_j];
          callback();
        }
        return delete cb[threadPage];
      }
    };
  };

  loadPost = function(link, filtered) {
    return function(event) {
      var cell, id, match, newLink, node, page, threadPage, threadid;
      if (event != null) {
        event.stopPropagation();
        event.preventDefault();
      }
      newLink = link.previousSibling;
      cell = link.parentNode;
      node = getFirstTagParent(link, 'TR');
      threadid = link.href.match(/threadid=(\d+)/i);
      threadid = threadid != null ? threadid[1] : '0';
      match = link.href.match(/([^#]*)(?:#post(\d+))?/i);
      if (match != null) {
        id = match[2] != null ? 'post' + match[2] : id = 'thread' + threadid;
      } else {
        return;
      }
      if (id in sR) {
        if (filtered === true) {
          return filterPost(id)();
        } else {
          return toggleVisibility(sR[id]);
        }
      } else {
        page = link.href.match(/page=(\d+)/i);
        page = page != null ? parseInt(page[1], 10) : 1;
        link.previousSibling.textContent = loadingText;
        threadPage = "threadid=" + threadid + "&page=" + page;
        if (threadPage in tP) {
          if (tP[threadPage] === 'Loading') {
            cb[threadPage].push(processThreadPage(id, threadid, page, node, newLink));
            if (filtered === true) {
              return cb[threadPage].push(filterPost(id));
            }
          } else {
            processThreadPage(id, threadid, page, node, newLink)();
            if (filtered === true) {
              return filterPost(id)();
            }
          }
        } else {
          loadThreadPage(threadid, page);
          cb[threadPage].push(processThreadPage(id, threadid, page, node, newLink));
          if (filtered === true) {
            return cb[threadPage].push(filterPost(id));
          }
        }
      }
    };
  };

  toggleVisibility = function(elem) {
    if (elem.td.parentNode.style.visibility === 'collapse') {
      showPost(elem, null)();
      return elem.td.parentNode.style.visibility = 'visible';
    } else {
      return elem.td.parentNode.style.visibility = 'collapse';
    }
  };

  showPost = function(elem, prev) {
    return function(event) {
      var nextTP, prevTP, threadPage;
      threadPage = "threadid=" + elem.threadid + "&page=" + elem.page;
      nextTP = "threadid=" + elem.threadid + "&page=" + (elem.page + 1);
      prevTP = "threadid=" + elem.threadid + "&page=" + (elem.page - 1);
      if (event != null) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (prev === true) {
        if (elem.index === 0 && elem.page > 1) {
          if (prevTP in tP) {
            if (tP[prevTP] === 'Loading') {
              return cb[prevTP].push(showPost(elem, prev));
            } else {
              elem.page = elem.page - 1;
              elem.index = tP[prevTP].length - 1;
              return elem.td.replaceChild(tP[prevTP][elem.index], elem.td.lastChild);
            }
          } else {
            loadThreadPage(elem.threadid, elem.page - 1);
            return cb[prevTP].push(showPost(elem, prev));
          }
        } else {
          elem.index = Math.max(elem.index - 1, 0);
          return elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
        }
      } else if (prev === false) {
        if (elem.index === 24) {
          if (nextTP in tP) {
            if (tP[nextTP] === 'Loading') {
              return cb[prevTP].push(showPost(elem, prev));
            } else {
              if (tP[nextTP].length > 0) {
                elem.page = elem.page + 1;
                elem.index = 0;
                return elem.td.replaceChild(tP[nextTP][0], elem.td.lastChild);
              }
            }
          } else {
            loadThreadPage(elem.threadid, elem.page + 1);
            return cb[nextTP].push(showPost(elem, prev));
          }
        } else {
          elem.index = Math.min(elem.index + 1, tP[threadPage].length - 1);
          return elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
        }
      } else {
        if (elem.td.hasChildNodes() === true) {
          return elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
        } else {
          return elem.td.appendChild(tP[threadPage][elem.index]);
        }
      }
    };
  };

  filterPost = function(id) {
    return function() {
      var elem, toFilter, user_name, _i, _len;
      elem = sR[id];
      toFilter = true;
      for (_i = 0, _len = user_filter.length; _i < _len; _i++) {
        user_name = user_filter[_i];
        if (elem.user.toUpperCase() === user_name.toUpperCase()) {
          toFilter = false;
          break;
        }
      }
      if (toFilter) {
        elem.td.parentNode.style.visibility = 'collapse';
        return elem.parent.style.visibility = 'collapse';
      }
    };
  };

  if (workInRestOfForum || workInForumSearch) {
    patt = document.querySelector('form[action=""] input[name="search"]');
    if (patt != null) {
      patt = patt.value.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\s+/g, '|');
    } else {
      patt = '';
    }
    allResults = document.querySelectorAll('a[href^="/forums.php?action=viewthread"]');
    for (_i = 0, _len = allResults.length; _i < _len; _i++) {
      result = allResults[_i];
      textReplace(result);
      a = document.createElement('a');
      a.href = '#';
      a.textContent = loadText;
      a.addEventListener('click', loadPost(result, false), true);
      myCell = result.parentNode;
      myCell.insertBefore(a, result);
    }
  }

  if (workInForumSearch) {
    user_tr = document.createElement('tr');
    user_td = [];
    user_td.push(document.createElement('td'));
    user_td.push(document.createElement('td'));
    user_td[0].className = 'label';
    strong = document.createElement('strong');
    strong.textContent = 'Filter author(s):';
    user_td[0].appendChild(strong);
    input = document.createElement('input');
    input.placeholder = 'Comma- or space-separated list of authors';
    input.size = '64';
    button = document.createElement('button');
    button.textContent = 'Filter';
    button.type = 'button';
    user_td[1].appendChild(input);
    user_td[1].appendChild(button);
    user_tr.appendChild(user_td[0]);
    user_tr.appendChild(user_td[1]);
    searchForums = document.querySelector('select[name="forums[]"]').parentNode.parentNode;
    searchForums.parentNode.insertBefore(user_tr, searchForums);
    button.addEventListener('click', function(event) {
      var userName, _j, _len1, _results;
      if (input.value.replace(/[,\s]/g, '') !== '') {
        user_filter = (function() {
          var _j, _len1, _ref, _results;
          _ref = input.value.trim().replace(/[,\s]+/g, ',').split(',');
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            userName = _ref[_j];
            _results.push(userName.trim());
          }
          return _results;
        })();
        button.disabled = 'disabled';
        _results = [];
        for (_j = 0, _len1 = allResults.length; _j < _len1; _j++) {
          result = allResults[_j];
          _results.push(loadPost(result, true)());
        }
        return _results;
      }
    }, true);
    if (hideSubSelection) {
      searchForumsNew = searchForums.cloneNode(true);
      searchForums.style.visibility = 'collapse';
      searchForumsCB = searchForumsNew.cells[1];
      while (searchForumsCB.hasChildNodes()) {
        searchForumsCB.removeChild(searchForumsCB.lastChild);
      }
      newCheckbox = document.createElement('input');
      newCheckbox.type = 'checkbox';
      searchForumsCB.appendChild(newCheckbox);
      searchForumsCB.appendChild(document.createTextNode(' Show forum selection: select (sub-) forums to search in.'));
      searchForums.parentNode.insertBefore(searchForumsNew, searchForums);
      newCheckbox.addEventListener('change', function(event) {
        searchForums.style.visibility = 'visible';
        return searchForumsNew.style.visibility = 'collapse';
      }, true);
    }
  }

  if (showFastSearchLinks) {
    forumid = document.URL.match(/forumid=(\d+)/i);
    if (forumid != null) {
      forumid = parseInt(forumid[1], 10);
      quickLink = document.createElement('a');
      quickLink.textContent = ' [Search this forum] ';
      quickLink.href = "/forums.php?action=search&forums[]=" + forumid;
      linkbox1 = document.querySelector('div.linkbox');
      newLinkBox = linkbox1.cloneNode(true);
      while (newLinkBox.hasChildNodes()) {
        newLinkBox.removeChild(newLinkBox.lastChild);
      }
      linkbox1.parentNode.insertBefore(newLinkBox, linkbox1);
      newLinkBox.appendChild(quickLink);
      forumIds = document.querySelectorAll('table a[href^="/forums.php?action=viewforum&forumid="]');
      forumIds = (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = forumIds.length; _j < _len1; _j++) {
          myLINK = forumIds[_j];
          _results.push(parseInt((myLINK.href.match(/forumid=(\d*)/i))[1], 10));
        }
        return _results;
      })();
      if (forumIds.length > 0) {
        forumIds.push(forumid);
        quickLinkSubs = document.createElement('a');
        quickLinkSubs.textContent = ' [Search this forum and all direct subforums] ';
        quickLinkSubs.href = "/forums.php?action=search&forums[]=" + forumIds.join('&forums[]=');
        newLinkBox.appendChild(quickLinkSubs);
      }
    }
  }

}).call(this);
