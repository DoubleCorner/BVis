/**
 * Created by Corner on 2017/2/23.
 */
//全部站点数据
var stations_info;
//全部线路信息
var routes_info;
//全部路段信息
var sections_info;
//站点重要性
var station_sign_info;
//站点停车时间视图
var stay_time_view;
//承载地图视图的全局变量
var map_view;
// 路段速度
var section_speed_view;
//站点指标视图
var significant_view;
//构造系统
ConstructorClass();

function ConstructorClass() {
  $(window).resize(function () {
    window.location.reload();
  });
  $("#map_container").outerWidth($(document).outerWidth() * 0.85 - 430);
  initData();

  function initData() {
    $.ajax({
      type: "get",
      dataType: "json",
      url: "/init_data",
      async: true,
      contentType: "application/json",
      success: function (data) {
        constructor(data);
      },
      Error: function () {
        console.log("获取数据失败");
      }
    });
  }

  function constructor(init_data) {
    stations_info = init_data.station;
    sections_info = init_data.section;
    routes_info = init_data.route;
    station_sign_info = init_data.sign;
    significant_view = new SignificantClass();
    map_view = new MapViewClass();
    stay_time_view = new StayTimeClass();
    section_speed_view = new SectionSpeedClass();
    CtrlBoxClass();
    SearchHintClass();
  }
}
