/**
 * Created by Corner on 2017/3/2.
 */

//计算两个GPS的距离
/**
 * @return {number}
 */
function gpsDistance(lat1, lng1, lat2, lng2) {
  var _distance = 0;

  var pk = 180 / Math.PI;

  var a1 = lat1 / pk;
  var a2 = lng1 / pk;
  var b1 = lat2 / pk;
  var b2 = lng2 / pk;

  var t1 = Math.cos(a1) * Math.cos(a2) * Math.cos(b1) * Math.cos(b2);
  var t2 = Math.cos(a1) * Math.sin(a2) * Math.cos(b1) * Math.sin(b2);
  var t3 = Math.sin(a1) * Math.sin(b1);
  var tt = Math.acos(t1 + t2 + t3);

  _distance = 6366000 * tt;

  return _distance;
}

//根据GPS和范围（单位m）求GPS范围
function getAround(lat, lng, radius) {
  var degree = (24901 * 1609) / 360.0;

  var radiusMile = radius;

  var dpmLat = 1 / degree;

  var radiusLat = dpmLat * radiusMile;

  var minLat = lat - radiusLat;

  var maxLat = lat + radiusLat;

  var mpdLng = degree * Math.cos(lat * (Math.PI / 180));

  var dpmLng = 1 / mpdLng;

  var radiusLng = dpmLng * radiusMile;

  var minLng = lng - radiusLng;

  var maxLng = lng + radiusLng;

  return [minLat, minLng, maxLat, maxLng];
}

//获取经过路线最多的极值
/**
 * @return {number}
 */
function getRoutesNumberMax() {
  var max = 0;
  for (var i = 0; i !== stations_info.length; ++i) {
    if (max < stations_info[i].routes_number) {
      max = stations_info[i].routes_number;
    }
  }
  return max;
}

//获取使用频率最高的路段
function getSectionFreMax() {
  var max = 0;
  for (var i = 0; i !== sections_info.length; ++i) {
    if (max < sections_info[i].frequency) {
      max = sections_info[i].frequency;
    }
  }
  return max;
}

//编辑距离
function editDistance(s, array) {
  function distance(s, t) {
    var n = s.length;// length of s
    var m = t.length;// length of t
    var d = [];// matrix
    var i;// iterates through s
    var j;// iterates through t
    var s_i;// ith character of s
    var t_j;// jth character of t
    var cost;// cost
    // Step 1
    if (n === 0) return m;
    if (m === 0) return n;
    // Step 2
    for (i = 0; i <= n; i++) {
      d[i] = [];
      d[i][0] = i;
    }
    for (j = 0; j <= m; j++) {
      d[0][j] = j;
    }
    // Step 3
    for (i = 1; i <= n; i++) {
      s_i = s.charAt(i - 1);
      // Step 4
      for (j = 1; j <= m; j++) {
        t_j = t.charAt(j - 1);
        // Step 5
        if (s_i === t_j) {
          cost = 0;
        } else {
          cost = 1;
        }
        // Step 6
        d[i][j] = minNumber(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      }
    }
    // Step 7
    return d[n][m];
  }

  //求两个字符串的相似度,返回相似度百分比
  /**
   * @return {string}
   */
  function editDistancePercent(s, t) {
    var l = s.length > t.length ? s.length : t.length;
    var d = distance(s, t);
    return (1 - d / l).toFixed(4);
  }

  //求三个数字中的最小值
  function minNumber(a, b, c) {
    return a < b ? (a < c ? a : c) : (b < c ? b : c);
  }

  var present = [];
  var result = [];
  for (var i = 0; i < array.length; i++) {
    var Percent = editDistancePercent(s, array[i]);
    if (Percent !== 0) {
      for (var j = 0; j <= present.length; j++) {
        if (j === present.length) {
          present.push(Percent);
          result.push(array[i]);
          break;
        } else {
          if (parseFloat(Percent) > parseFloat(present[j])) {
            present.splice(j, 0, Percent);
            result.splice(j, 0, array[i]);
            break;
          }
        }
      }
    }
  }
  if (result.length > 10) {
    return result.slice(0, 10);
  } else {
    return result;
  }
}