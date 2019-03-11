population.csv:
rec,address（村委会地址），code2（村委会编号），code（村委会编号），count（总人数），lat（纬度），lng（经度）

section.json：
distance（距离），frequency（路程中点标记的个数），from_id（起始站点id），from_name（起始站点名称），path（在地图上标注点经纬度数组），section（线路id），target_id（目的地id），target_name（目的地name）

station.json：
latitude（纬度），longitude（经度），routes_id（该站点的公交车路数），routes_number（该站点的公交车路数sum），sub_routes_id（该站点的公交车路数id），sub_routes_number（该站点的公交车路数id sum）

station_check_data.csv：
end_date_time（公交车到站时间），id（），product_id（），route_id（公交车id），start_data_time（发车时间），station_id（站点id），station_name（站点名称），stay_time（停留时间），sub_route_id（公交车id）

station_run_data.csv：
end_date_time（公交车到站时间），id（），product_id（车辆id），route_id（公交车路数），start_date_time（发车时间），station_name（站点名称），station_id（站点id），sub_route_id（线路id）