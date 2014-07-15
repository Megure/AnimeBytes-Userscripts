// Generated by CoffeeScript 1.6.3
/*
// ==UserScript==
// @name        Hit&Run Detector
// @namespace   Megure@AnimeBytes.tv
// @description Highlights torrents which might become a Hit & Run; allows sorting on all history-pages
// @include     http*://animebytes.tv*alltorrents.php*
// @version     0.82
// @grant       GM_getValue
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==
*/


(function() {
  var a1, a2, allRows, andRe, clonedNode, colorRows, curPage, currencyRe, dateTimeRe, downIndex, downRe, dur2string, durIndex, durationRe, dynamicLoad, header, headers, index, lastPage, lcNegBG, lcNegFG, lcNeuBG, lcNeuFG, lcPosBG, lcPosFG, line_color_neg, line_color_neu, line_color_pos, loadPage, multiRatio, newPagenum, nextPage, pagenum, pagenums, parseCell, parseRows, prevPage, ratioIndex, ratioRe, sizeIndex, sizeRe, sortFunctions, sortIndex, sortRows, unitPrefix, _i, _j, _len, _len1;

  colorRows = GM_getValue('ABHistColorRows', 'true');

  sortRows = GM_getValue('ABHistSortRows', 'true');

  dynamicLoad = GM_getValue('ABHistDynLoad', 'true');

  lcPosBG = GM_getValue('ABHistColorPosBG', 'PaleGreen');

  lcNeuBG = GM_getValue('ABHistColorNeuBG', 'Khaki');

  lcNegBG = GM_getValue('ABHistColorNegBG', 'NavajoWhite');

  lcPosFG = GM_getValue('ABHistColorPosFG', 'Black');

  lcNeuFG = GM_getValue('ABHistColorNeuFG', 'Black');

  lcNegFG = GM_getValue('ABHistColorNegFG', 'Black');

  line_color_neg = [lcNegBG, lcNegFG];

  line_color_neu = [lcNeuBG, lcNeuFG];

  line_color_pos = [lcPosBG, lcPosFG];

  sizeRe = /^([\d\.]+)\s([A-Z]?)B$/i;

  downRe = /^([\d\.]+)\s([A-Z]?)B\s\(([\d\.]+)%\)$/i;

  ratioRe = /^(∞|\-\-|[\d\.]+)$/i;

  andRe = /(and|\s)/ig;

  durationRe = /^(?:(\d+)years?)?(?:(\d+)months?)?(?:(\d+)weeks?)?(?:(\d+)days?)?(?:(\d+)hours?)?(?:(\d+)minutes?)?(?:(\d+)seconds?)?$/i;

  dateTimeRe = /^(\d+)\-(\d{1,2})\-(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/i;

  currencyRe = /^(?:[¥|€|£|\$]\s*)([\d\.]+)$/i;

  downIndex = null;

  sizeIndex = null;

  durIndex = null;

  ratioIndex = null;

  multiRatio = false;

  allRows = [];

  unitPrefix = function(prefix) {
    switch (prefix.toUpperCase()) {
      case '':
        return 1 / 1073741824;
      case 'K':
        return 1 / 1048576;
      case 'M':
        return 1 / 1024;
      case 'G':
        return 1;
      case 'T':
        return 1024;
      case 'P':
        return 1048576;
      case 'E':
        return 1073741824;
      default:
        return 0;
    }
  };

  dur2string = function(duration) {
    var tempH, tempM;
    tempH = Math.floor(duration);
    tempM = Math.ceil((duration * 60) % 60);
    if (tempM === 60) {
      tempH += 1;
      tempM = 0;
    }
    if (tempM === 0) {
      return '' + tempH;
    } else if (tempM < 10) {
      return '' + tempH + ':0' + tempM;
    } else {
      return '' + tempH + ':' + tempM;
    }
  };

  parseCell = function(cell, index) {
    var match, num, textContent, textContentNoComma;
    textContent = cell.textContent.trim();
    textContentNoComma = textContent.replace(/,/g, '').trim();
    match = cell.querySelector('img');
    if (cell.textContent === '' && (match != null)) {
      return match.alt.toUpperCase();
    }
    match = textContentNoComma.match(downRe);
    if (match != null) {
      downIndex = index;
      return [parseFloat(match[1]) * unitPrefix(match[2]), parseFloat(match[3])];
    }
    match = textContentNoComma.match(sizeRe);
    if (match != null) {
      sizeIndex = index;
      return parseFloat(match[1]) * unitPrefix(match[2]);
    }
    match = textContentNoComma.match(dateTimeRe);
    if (match != null) {
      match.shift();
      match = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = match.length; _i < _len; _i++) {
          num = match[_i];
          _results.push(parseInt(num, 10));
        }
        return _results;
      })();
      return new Date(match[0], match[1] - 1, match[2], match[3], match[4]);
    }
    match = textContentNoComma.replace(andRe, '').match(durationRe);
    if (match != null) {
      durIndex = index;
      match.shift();
      match = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = match.length; _i < _len; _i++) {
          num = match[_i];
          if (num != null) {
            _results.push(parseInt(num, 10));
          } else {
            _results.push(0);
          }
        }
        return _results;
      })();
      return 24 * (match[0] * 365.25 + match[1] * 30.4375 + match[2] * 7 + match[3]) + match[4] + match[5] / 60 + match[6] / 3600;
    }
    match = textContentNoComma.match(currencyRe);
    if (match != null) {
      return parseFloat(match[1]);
    }
    match = textContentNoComma.match(ratioRe);
    if (match != null) {
      if ((ratioIndex != null) && ratioIndex !== index) {
        multiRatio = true;
      }
      ratioIndex = index;
      switch (match[1]) {
        case '∞':
          return Infinity;
        case '--':
          return -0.2;
        case '0':
          return -0.1;
        default:
          return parseFloat(match[1]);
      }
    } else if (textContentNoComma === 'Never') {
      durIndex = index;
      return 0;
    } else {
      return textContent.toUpperCase();
    }
  };

  parseRows = function(myDocument) {
    var cell, completion, downloaded, index, line_color, minSeedingTime, myData, ratio, row, seedingTime, size, torrent_rows, _i, _len, _ref;
    torrent_rows = myDocument.querySelectorAll('tr[class="torrent"]');
    for (_i = 0, _len = torrent_rows.length; _i < _len; _i++) {
      row = torrent_rows[_i];
      myData = (function() {
        var _j, _len1, _ref, _results;
        _ref = row.cells;
        _results = [];
        for (index = _j = 0, _len1 = _ref.length; _j < _len1; index = ++_j) {
          cell = _ref[index];
          _results.push(parseCell(cell, index));
        }
        return _results;
      })();
      completion = 100;
      downloaded = 0;
      size = 0;
      ratio = 0;
      line_color = ['', ''];
      if (downIndex != null) {
        _ref = myData[downIndex], downloaded = _ref[0], completion = _ref[1];
        if (completion > 0) {
          size = downloaded * 100 / completion;
        } else {
          size = downloaded;
        }
        myData[downIndex] = downloaded;
      } else if (sizeIndex != null) {
        size = myData[sizeIndex];
      }
      if ((ratioIndex != null) && !multiRatio) {
        ratio = myData[ratioIndex];
      }
      if ((durIndex != null) && (document.URL.indexOf('action=history') >= 0 || document.URL.indexOf('type=seeding') >= 0)) {
        minSeedingTime = 72 + 5 * Math.max(size - 10, 0);
        seedingTime = myData[durIndex];
        if (myData[myData.length - 1] === 'EXEMPT') {
          line_color = line_color_pos;
          myData[durIndex] = Math.min(0, minSeedingTime - seedingTime);
        } else if (completion >= 10 && ratio < 1 && seedingTime < minSeedingTime) {
          line_color = line_color_neg;
          myData[durIndex] = minSeedingTime - seedingTime;
          row.cells[durIndex].innerHTML += "<br />(~" + (dur2string(minSeedingTime - seedingTime)) + "h to seed)";
        } else if (seedingTime >= minSeedingTime || ratio >= 1) {
          line_color = line_color_pos;
          myData[durIndex] = Math.min(0, minSeedingTime - seedingTime);
        } else if (seedingTime > 0) {
          line_color = line_color_pos;
          myData[durIndex] = Math.min(0, minSeedingTime - seedingTime);
        } else {
          line_color = line_color_neu;
          myData[durIndex] = Math.min(0.000001 * (completion + 1), minSeedingTime - seedingTime);
        }
        if (colorRows.toString() === 'true') {
          if (line_color[0] !== '') {
            row.style.backgroundColor = line_color[0];
          }
          if (line_color[1] !== '') {
            row.style.color = line_color[1];
          }
        }
      }
      if (headers[0] != null) {
        headers[0].parentNode.parentNode.appendChild(row);
      }
      if (sortRows.toString() === 'true') {
        allRows.push([row].concat(myData));
      }
    }
    return void 0;
  };

  sortIndex = null;

  sortFunctions = function(index, force) {
    return function(event) {
      var row, _i, _len;
      if (event != null) {
        event.stopPropagation();
        event.preventDefault();
      }
      if ((index != null) && (allRows[0] != null)) {
        if (sortIndex === index && force === false) {
          allRows.reverse();
        } else {
          sortIndex = index;
          allRows.sort(function(a, b) {
            if ((a[index + 1] != null) && (b[index + 1] != null)) {
              if (a[index + 1] > b[index + 1]) {
                return -1;
              } else if (a[index + 1] < b[index + 1]) {
                return 1;
              } else {
                return 0;
              }
            } else if ((a[index + 1] != null) && (b[index + 1] == null)) {
              return -1;
            } else if ((b[index + 1] != null) && (a[index + 1] == null)) {
              return 1;
            } else {
              return 0;
            }
          });
        }
        for (_i = 0, _len = allRows.length; _i < _len; _i++) {
          row = allRows[_i];
          row[0].parentNode.appendChild(row[0]);
        }
      }
      return void 0;
    };
  };

  headers = document.querySelector('tr.colhead');

  if (headers != null) {
    headers = headers.cells;
  } else {
    headers = [];
  }

  parseRows(document);

  if (sortRows.toString() === 'true') {
    for (index = _i = 0, _len = headers.length; _i < _len; index = ++_i) {
      header = headers[index];
      a1 = document.createElement('a');
      a1.href = '#';
      if (index === 0) {
        a1.textContent = 'Type';
      } else if ((header.querySelector('a') != null) || header.textContent.trim() === '') {
        a1.textContent = '*';
      } else {
        a1.textContent = header.textContent;
      }
      if (a1.textContent !== '*') {
        while (header.hasChildNodes()) {
          header.removeChild(header.lastChild);
        }
      }
      header.appendChild(a1);
      a1.addEventListener('click', sortFunctions(index, false), true);
    }
  }

  if (dynamicLoad.toString() === 'true') {
    curPage = document.URL.match(/page=(\d+)/i);
    curPage = curPage != null ? parseInt(curPage[1], 10) : 1;
    prevPage = curPage - 1;
    nextPage = curPage + 1;
    lastPage = 1;
    pagenums = document.querySelectorAll('div.pagenums');
    loadPage = function(prev) {
      if (prev == null) {
        prev = false;
      }
      return function(event) {
        var newPage, newURL, xhr;
        if (event != null) {
          event.stopPropagation();
          event.preventDefault();
        }
        if (prev) {
          newPage = prevPage--;
        } else {
          newPage = nextPage++;
        }
        if (newPage < 1 || newPage > lastPage) {
          return;
        }
        newURL = document.URL.split('#')[0];
        if (newURL.indexOf('page=') >= 0) {
          newURL = newURL.replace(/page=(\d+)/i, "page=" + newPage);
        } else {
          newURL += "&page=" + newPage;
        }
        xhr = new XMLHttpRequest();
        xhr.open('GET', newURL, true);
        xhr.send();
        return xhr.onreadystatechange = function() {
          var newDoc, parser;
          if (xhr.readyState === 4) {
            parser = new DOMParser();
            newDoc = parser.parseFromString(xhr.responseText, 'text/html');
            parseRows(newDoc);
            return sortFunctions(sortIndex, true)(null);
          }
        };
      };
    };
    for (_j = 0, _len1 = pagenums.length; _j < _len1; _j++) {
      pagenum = pagenums[_j];
      if (pagenum.lastChild.href != null) {
        lastPage = pagenum.lastChild.href.match(/page=(\d+)/i);
        lastPage = lastPage != null ? parseInt(lastPage[1], 10) : 1;
      } else {
        lastPage = parseInt(pagenum.lastChild.textContent, 10);
        if (isNaN(lastPage)) {
          lastPage = 1;
        }
      }
      clonedNode = pagenum.parentNode.cloneNode(true);
      newPagenum = clonedNode.querySelector('div[class="pagenums"]');
      while (newPagenum.hasChildNodes()) {
        newPagenum.removeChild(newPagenum.lastChild);
      }
      a1 = document.createElement('a');
      a1.href = '#';
      a1.className = 'next-prev';
      a1.textContent = 'Load next page dynamically →';
      a2 = document.createElement('a');
      a2.href = '#';
      a2.className = 'next-prev';
      a2.textContent = '← Load previous page dynamically';
      newPagenum.appendChild(a2);
      newPagenum.appendChild(a1);
      a1.addEventListener('click', loadPage(false), true);
      a2.addEventListener('click', loadPage(true), true);
      pagenum.parentNode.parentNode.insertBefore(clonedNode, pagenum.parentNode.nextSibling);
    }
  }

}).call(this);
