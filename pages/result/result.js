
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
    data['distance'] = options.distance
    data['stepFreq'] = parseInt(options.stepCount / (options.sportTime/60))
    data['stepCount'] = options.stepCount
    data['gct'] = options.gct
    data['touchType'] = ['未知','前掌着地','全掌着地','后跟着地','纯前掌着地'][options.touchType]
    data['pronationType'] = ['未知','内旋过度','内旋正常','内旋不足'][options.pronationType]
    this.setData(data)
  }
}

pageData.bindButtonTap = function (e) {
  wx.reLaunch({
    url: 'pages/index/index'
  })
}

Page(pageData)