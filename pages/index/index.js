var util = require('../../utils/util.js')

//index.js
//获取应用实例
var app = getApp()
var writeCharacteristics = null
var isNotify = false
var currentDeviceId = null
var serviceId = null
var characteristicId ='6E400002-B5A3-F393-E0A9-E50E24DCCA9E'
var isRunning = false
var isConnecting = false
var last_device_id = null
wx.getStorage({
  key: 'last_device_id',
  success: function(res) {
      last_device_id = res.data
  } 
})




// var startTime = 0

var startRunning =  function(deviceId, serviceId, characteristicId, value) {
  if (writeCharacteristics && isNotify) {
    // startTime = Date.parse(new Date())
    setInterval(getLocation,5000)
    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: serviceId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: characteristicId,
      value: util.char2buf(value),
      success: function (res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
      }
    })
  }
}

var locations = []
var lastLocation = null
var totalDistance = 0

function getLocation(){
  wx.getLocation({
    // type: 'gcj02', //返回可以用于wx.openLocation的经纬度
    type: 'wgs84',
    success: function(res) {
      var latitude = res.latitude
      var longitude = res.longitude
      if (lastLocation) {
        totalDistance += util.calcCrow(lastLocation.longitude, lastLocation.latitude, longitude, latitude) * 1000
        console.log("移动"+totalDistance+"米")
      }
      lastLocation = {
        latitude:latitude,
        longitude:longitude
      }
      locations.push(lastLocation)
    }
  })
}

function search(that) {
  wx.showLoading({
    title: '搜索中',
  })

  wx.startBluetoothDevicesDiscovery({
    services: ['00001801-0000-1000-8000-00805F9B34FB'],
    success: function (res2) {
      wx.onBluetoothDeviceFound(function(res) {
        console.log(res['devices'][0])
        //测试用过滤代码
        if (res['devices'][0].RSSI > 0 ) {
          return
        }
        if (last_device_id && last_device_id == res['devices'][0].deviceId) {
          wx.showModal({
            title: '提示',
            content: '发现上次连接设备，是否确定进行自动连接？',
            success: function(res) {
              if (res.confirm) {
                wx.stopBluetoothDevicesDiscovery({
                  success: function (res) {
                    console.log(res)
                  }
                })
                isConnecting = true
                wx.showLoading({
                  title: '自动连接中',
                })
                console.log('自动连接中'+last_device_id)
                connect(last_device_id, that)
              } else if (res.cancel) {
                last_device_id = null
                wx.removeStorage({
                  key: 'last_device_id',
                  success: function(res) {
                    console.log("清除自动连接设备成功"+res)
                  } 
                })
              }
            }
          })
        }

        var device_list = that.data.device_list
        var hadFound = false

        for(var deviceIndex = 0; deviceIndex < device_list.length; ++deviceIndex) {
          var device = device_list[deviceIndex]
          if (res['devices'][0].deviceId == device.uuid) {
            hadFound = true
            console.log('更新RSSI:',device.uuid)
            device_list[deviceIndex].rssi = res['devices'][0].RSSI + 130
          }
        }
        if (!hadFound) {
          if (res['devices'][0].RSSI > -70) {
            device_list.push({
              name:res['devices'][0].name,
              rssi:(res['devices'][0].RSSI+130),
              uuid:res['devices'][0].deviceId
            })
          }
        }
        wx.hideLoading()
        that.setData({
          device_list:device_list
        })
      })
    }
  })
}

var pageData = {
  data: {
    device_list:[],
    distance:0,
    stepCount:0,
    gct:0,
    stepFreq:0,
    touchType: '未知',
    pronationType: '未知',
    isConntected: false,
    isRunning: false
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this

    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    })

    wx.openBluetoothAdapter({
      success: function (res) {
        // wx.getBluetoothAdapterState({
        //   success: function (res) {
        //     console.log(res)
        //   }
        // })
        search(that)

      }
    })
    // wx.onBLEConnectionStateChanged(function(connectionRes) {
    //   console.log('连接状态改变')
    //   if (connectionRes.connected) {
    //     data = {device_list:[]}
    //     data['dataShow'] = true
    //     that.setData(data)
    //     wx.getBLEDeviceServices({
    //       // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    //       deviceId: connectionRes.deviceId,
    //       success: function (foundServicesRes) {
    //         for (service in foundServicesRes.services) {
    //           if (service.uuid == '6E400001-B5A3-F393-E0A9-E50E24DCCA9E') {
    //             wx.getBLEDeviceCharacteristics({
    //               // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    //               deviceId: connectionRes.deviceId,
    //               // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
    //               serviceId: service.uuid,
    //               success: function (foundCharacterRes) {
    //                 for (charcterRes in foundCharacterRes.characteristics) {
    //                   if (charcterRes.uuid == '6E400002-B5A3-F393-E0A9-E50E24DCCA9E') {
    //                     writeCharacteristics = charcterRes
    //                     startRunning(connectionRes.deviceId, service.uuid, charcterRes.uuid, 'ES')
    //                   } else {
    //                     wx.notifyBLECharacteristicValueChanged({
    //                       state: true, // 启用 notify 功能
    //                       // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    //                       deviceId: connectionRes.deviceId,
    //                       // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
    //                       serviceId: service.uuid,
    //                       // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
    //                       characteristicId: charcterRes.uuid,
    //                       success: function (res) {
    //                         //开启notify成功
    //                         console.log('notifyBLECharacteristicValueChanged success', res.errMsg)
    //                         isNotify = true
    //                         startRunning(connectionRes.deviceId, service.uuid, charcterRes.uuid, 'ES')
    //                       }
    //                     })
    //                   }
    //                 }
    //               }
    //             })
    //           }
    //         }
    //       }
    //     })
    //   } else {
    //     //TODO 提示连接失败
    //   }
    // })
    
    wx.onBLECharacteristicValueChange(function(res) {
      // console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
      var footDatas = new Uint8Array(res.value)
      if (footDatas[0] == 4) {
        var stepCount = footDatas[1]*256*256 + footDatas[2]*256 + footDatas[3]
        var stepFreq = footDatas[4]*256 + footDatas[5]
        var gct = footDatas[6]*256 + footDatas[7]
        var touchTypeEnum = (footDatas[8] & 0xf0) >> 4
        var pronationTypeEnum = footDatas[8] & 0x0f
        var touchType = ['未知','前掌着地','全掌着地','后跟着地','纯前掌着地'][touchTypeEnum]
        var pronationType = ['未知','内旋过度','内旋正常','内旋不足'][pronationTypeEnum]
        var data = {
          distance:parseInt(totalDistance),
          stepCount:stepCount,
          gct:gct,
          stepFreq:stepFreq,
          touchType:touchType,
          pronationType:pronationType,
        }
        that.setData(data)
      }
    })



  }
}

pageData.bindSearchButtonTap = function (e) {
  if (!isConnecting) {
    search(this)
  }
}

pageData.bindButtonTap = function (e) {
  if (!isRunning) {
    startRunning(currentDeviceId,serviceId,characteristicId,'ES')
    var data = {
      isRunning : true
    }
    this.setData(data)
  }
}

function connect(deviceId, that) {
  currentDeviceId = deviceId
  wx.createBLEConnection({
    // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    deviceId: deviceId,
    success: function (res) {
      if(res.errMsg.indexOf("ok") < 0 ) { 
        isConnecting = false
        wx.hideLoading()
        wx.showToast({
          title: '连接失败',
          icon: 'loading',
          //image: '', //TODO error的图片
          duration: 2000
        })
        return
      } 

      var data = {device_list:[]}
      data['dataShow'] = true
      that.setData(data)
      wx.getBLEDeviceServices({
        // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
        deviceId: deviceId,
        success: function (foundServicesRes) {
          for (var serviceIndex = 0 ; serviceIndex < foundServicesRes.services.length; serviceIndex ++) {
            var service = foundServicesRes.services[serviceIndex]
            if (service.uuid == '6E400001-B5A3-F393-E0A9-E50E24DCCA9E') {
              serviceId = service.uuid
              wx.getBLEDeviceCharacteristics({
                // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
                deviceId: deviceId,
                // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                serviceId: service.uuid,
                success: function (foundCharacterRes) {
                  for (var characterIndex = 0 ; characterIndex < foundCharacterRes.characteristics.length ; characterIndex++ ) {
                    var charcterRes = foundCharacterRes.characteristics[characterIndex]
                    if (charcterRes.uuid == '6E400002-B5A3-F393-E0A9-E50E24DCCA9E') {
                      writeCharacteristics = charcterRes
                      // startRunning(deviceId, service.uuid, charcterRes.uuid, 'ES')
                      if (isNotify) {
                        that.setData({isConntected:true})
                        isConnecting = false
                        wx.hideLoading()
                        wx.showToast({
                          title: '连接成功',
                          icon: 'success',
                          duration: 2000
                        })
                      }
                    } else {
                      wx.notifyBLECharacteristicValueChanged({
                        state: true, // 启用 notify 功能
                        // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
                        deviceId: deviceId,
                        // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                        serviceId: service.uuid,
                        // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
                        characteristicId: charcterRes.uuid,
                        success: function (res) {
                          //开启notify成功
                          console.log('notifyBLECharacteristicValueChanged success', res.errMsg)
                          isNotify = true
                          // startRunning(deviceId, service.uuid, charcterRes.uuid, 'E')
                          if (writeCharacteristics) {
                            that.setData({isConntected:true})
                            isConnecting = false
                            wx.hideLoading()
                            wx.showToast({
                              title: '连接成功',
                              icon: 'success',
                              duration: 2000
                            })
                          }
                        }
                      })
                    }
                  }
                }
              })
            }
          }
        }
      })
    }
  })
}

pageData.widgetsToggle = function (e) {
  //先停止搜索
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      console.log(res)
    }
  })
  isConnecting = true
  wx.showLoading({
    title: '连接中',
  })
  console.log('连接中'+e.currentTarget.id)
  var that = this
  wx.setStorage({
    key:"last_device_id",
    data:e.currentTarget.id
  })

  connect(e.currentTarget.id, that)

    // var id = e.currentTarget.id, data = {};
    // for (var i = 0, len = type.length; i < len; ++i) {
    //     data[type[i] + 'Show'] = false;
    // }
    // data[id + 'Show'] = !this.data[id + 'Show'];
    // this.setData(data);
};
Page(pageData)