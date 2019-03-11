/**
 * Created by Corner on 2017/3/2.
 */
function CtrlBoxClass() {
  var controls = document.getElementsByClassName("_button");
  var map_div = document.getElementById("map");

  function changeColor(j) {
    for (var i = 0; i !== controls.length; i++) {
      if (i === j) {
        controls[i].style.background = "#cccccc";
      } else {
        controls[i].style.background = "#ffffff";
      }
    }
  }

  controls[0].onclick = function () {
    changeColor(0);
    map_view.ctrl_box_type = 0;
    map_div.style.cursor = "";
  };

  controls[1].onclick = function () {
    changeColor(1);
    map_view.ctrl_box_type = 1;
    map_div.style.cursor = "crosshair";
  };

  controls[2].onclick = function () {
    changeColor(2);
    map_view.ctrl_box_type = 2;
    map_div.style.cursor = "crosshair";
  };

  controls[3].onclick = function () {
    changeColor(3);
    map_view.ctrl_box_type = 3;
    map_div.style.cursor = "crosshair";
  };
  controls[4].onclick = function () {
    changeColor(4);
    map_view.showHideBusNetwork();
    map_div.style.cursor = "";
  };
  controls[5].onclick = function () {
    changeColor(5);
    map_view.showHideHeatStation();
    map_div.style.cursor = "";
  };
}