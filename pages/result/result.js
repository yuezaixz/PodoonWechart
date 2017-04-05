var totalDistance = 0
var stepFreq = 0
var stepCount = 0
var gct = 0
var sportTime = 0
var touchType = '未知着地方式'
var pronationType = '未知内旋方式'

var app = getApp()

var pageData = {
  data: {
  },
  onLoad: function (options) {
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    })
    var data = {}
    totalDistance = options.distance
    sportTime = options.sportTime
    stepCount = options.stepCount
    stepFreq = parseInt(options.stepCount / (options.sportTime/60))
    gct = options.gct
    touchType = ['未知','前掌着地','全掌着地','后跟着地','纯前掌着地'][options.touchType]
    pronationType = ['未知','内旋过度','内旋正常','内旋不足'][options.pronationType]

    data['distance'] = totalDistance
    data['stepFreq'] = stepFreq
    data['stepCount'] = stepCount
    data['gct'] = gct
    data['touchType'] = touchType
    data['pronationType'] = pronationType
    this.setData(data)
  },
  onShareAppMessage: function () {
    var resultUrl = '../result/result?stepCount='+stepCount+'&sportTime='+sportTime+'&distance='+totalDistance+'&gct='+gct+'&touchType='+touchType+'&pronationType='+pronationType
    return {
      title: '鞋垫检测结果',
      path: resultUrl,
      success: function(res) {
        // 分享成功
        console.log('分享成功')
      },
      fail: function(res) {
        // 分享失败
        console.log('分享失败')
      }
    }
  }
}

pageData.bindButtonTap = function (e) {
  wx.reLaunch({
    url: 'pages/index/index'
  })
}

Page(pageData)