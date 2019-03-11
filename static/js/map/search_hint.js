/**
 * Created by Corner on 2017/2/22.
 */
function SearchHintClass() {
  var hint_div = $("#searcherHintDIV");
  var search_div = $('#searcherDIV');
  //动态提示
  var NameArrayType = 0;
  var NameArray = [];

  function removeDuplicatedItem(ar) {
    var ret = [];
    for (var i = 0, j = ar.length; i !== j; i++) {
      if (ret.indexOf(ar[i]) === -1) {
        ret.push(ar[i]);
      }
    }
    return ret;
  }

  function loadNameArray() {
    if (NameArrayType === 0) {
      for (var i = 0; i !== stations_info.length; i++) {
        NameArray.push(stations_info[i].station_name);
      }
      for (i = 0; i !== routes_info.length; i++) {
        NameArray.push(routes_info[i].sub_route_id);
      }
      NameArrayType = 1;
    }
  }

  document.getElementById("searcherInput").onkeyup = function searchHintFun() {
    if (document.getElementById("searcherInput").value !== "") {
      clearHint();
      loadNameArray();
      var _resultArray = editDistance(document.getElementById("searcherInput").value, NameArray);
      _resultArray = removeDuplicatedItem(_resultArray);
      for (var i = 0; i !== _resultArray.length; i++) {
        addItems(_resultArray[i]);
      }
      showSearchHint();
    } else {
      hint_div.empty();
      hint_div.hide();
    }
  };
  //窗口大小重置时改变提示框大小
  window.onresize = function onResize() {
    var top = search_div.position().top;
    var left = search_div.position().left;
    hint_div.css("top", top + search_div.height());
    hint_div.css("left", left + 14);
    hint_div.css("width", $("#searcherInput").width() + 15);
  };
  //搜索按钮
  document.getElementById("searcherBT").onclick = search;

  //搜索
  function search() {
    for (var i = 0; i !== stations_info.length; i++) {
      if (stations_info[i].station_name.indexOf(document.getElementById("searcherInput").value) >= 0) {
        map_view.showStation(stations_info[i]);
      }
    }
    for (i = 0; i !== routes_info.length; i++) {
      if (routes_info[i].sub_route_id === document.getElementById("searcherInput").value) {
        map_view.showOrUpdateOneSubRoute(routes_info[i].sub_route_id);
        break;
      }
    }
    clearHint();
  }

  //添加提示信息
  function addItems(name) {
    var container = document.getElementById("searcherHintDIV");
    var item = document.createElement("div");
    item.innerHTML = name;
    item.style.cursor = "pointer";
    item.onclick = function onClick(name) {
      return function () {
        for (var i = 0; i !== stations_info.length; i++) {
          if (stations_info[i].station_name === name) {
            map_view.showStation(stations_info[i]);
            break;
          }
        }
        for (i = 0; i !== routes_info.length; i++) {
          if (routes_info[i].sub_route_id === name) {
            map_view.showOrUpdateOneSubRoute(routes_info[i].sub_route_id);
            break;
          }
        }
        clearHint();
      };
    }(name);
    item.onmouseover = function onMouseOver() {
      item.style.backgroundColor = "#cccccc";
    };
    item.onmouseout = function onMouseOut() {
      item.style.backgroundColor = "snow";
    };
    container.appendChild(item);
  }

  //清空提示窗
  function clearHint() {
    hint_div.empty();
  }

  //显示提示窗
  function showSearchHint() {
    hint_div.show();
    var top = search_div.position().top;
    var left = search_div.position().left;
    hint_div.css("top", top + search_div.height());
    hint_div.css("left", left + 14);
    hint_div.css("width", $("#searcherInput").width() + 15);

  }
}