//index.js
//获取应用实例
var app = getApp()
var writeCharacteristics = null
var isNotify = false
var deviceId = null
var serviceId = null
var characteristicId ='6E400002-B5A3-F393-E0A9-E50E24DCCA9E'
var isRunning = false

function char2buf(str){
  var out = new ArrayBuffer(str.length);
  var u16a= new Uint8Array(out);
  var strs = str.split("");
  for(var i =0 ; i<strs.length;i++){
      u16a[i]=strs[i].charCodeAt();
  }
  return out;
}

var startRunning =  function(deviceId, serviceId, characteristicId, value) {
  if (writeCharacteristics && isNotify) {
    console.log(char2buf(value))
    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: serviceId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: characteristicId,
      value: char2buf(value),
      success: function (res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
      }
    })
  }
}

function search(that) {
  wx.showToast({
    title: '搜索中',
    icon: 'loading',
    duration: 5000
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
        // if ('3ECDAA79-B231-40BA-B9BB-23AC99B0B6CC' != res['devices'][0].deviceId) {
        //   return
        // }

        var device_list = that.data.device_list
        var hadFound = false

        for(var deviceIndex = 0; deviceIndex < device_list.length; ++deviceIndex) {
          var device = device_list[deviceIndex]
          if (res['devices'][0].deviceId == device.uuid) {
            hadFound = true
            console.log('更新RSSI:',device.uuid)
            device_list[deviceIndex].rssi = res['devices'][0].RSSI
          }
        }
        if (!hadFound) {
          if (res['devices'][0].RSSI > -70) {
            device_list.push({
              name:res['devices'][0].name,
              rssi:res['devices'][0].RSSI,
              uuid:res['devices'][0].deviceId
            })
          }
        }
        wx.hideToast()
        that.setData({
          device_list:device_list
        })
      })
    }
  })
}

var pageData = {
  data: {
    motto: 'Hello World',
    device_list:[],
    stepCount:0,
    gct:0,
    stepFreq:0,
    touchType: '未知',
    pronationType: '未知',
    isConntected: false,
    isRunning: false,
    userInfo: {}
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
  search(this)
}

pageData.bindButtonTap = function (e) {
  if (!isRunning) {
    startRunning(deviceId,serviceId,characteristicId,'ES')
    var data = {
      isRunning : true
    }
    this.setData(data)
  }
}

pageData.widgetsToggle = function (e) {
  //先停止搜索
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      console.log(res)
    }
  })
  
  wx.showToast({
    title: '连接中',
    icon: 'loading',
    duration: 2000
  })
  console.log('连接中'+e.currentTarget.id)
  var that = this

  wx.createBLEConnection({
    // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    deviceId: e.currentTarget.id,
    success: function (res) {
      if(res.errMsg.indexOf("ok") < 0 ) { 
        wx.showToast({
          title: '连接失败',
          icon: 'loading',
          //image: '', //TODO error的图片
          duration: 2000
        })
        return
      } 
      deviceId = e.currentTarget.id
      var data = {device_list:[]}
      data['dataShow'] = true
      that.setData(data)
      wx.getBLEDeviceServices({
        // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
        deviceId: e.currentTarget.id,
        success: function (foundServicesRes) {
          for (var serviceIndex = 0 ; serviceIndex < foundServicesRes.services.length; serviceIndex ++) {
            var service = foundServicesRes.services[serviceIndex]
            if (service.uuid == '6E400001-B5A3-F393-E0A9-E50E24DCCA9E') {
              serviceId = service.uuid
              wx.getBLEDeviceCharacteristics({
                // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
                deviceId: e.currentTarget.id,
                // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                serviceId: service.uuid,
                success: function (foundCharacterRes) {
                  for (var characterIndex = 0 ; characterIndex < foundCharacterRes.characteristics.length ; characterIndex++ ) {
                    var charcterRes = foundCharacterRes.characteristics[characterIndex]
                    if (charcterRes.uuid == '6E400002-B5A3-F393-E0A9-E50E24DCCA9E') {
                      writeCharacteristics = charcterRes
                      // startRunning(e.currentTarget.id, service.uuid, charcterRes.uuid, 'ES')
                      if (isNotify) {
                        that.setData({isConntected:true})
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
                        deviceId: e.currentTarget.id,
                        // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                        serviceId: service.uuid,
                        // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
                        characteristicId: charcterRes.uuid,
                        success: function (res) {
                          //开启notify成功
                          console.log('notifyBLECharacteristicValueChanged success', res.errMsg)
                          isNotify = true
                          // startRunning(e.currentTarget.id, service.uuid, charcterRes.uuid, 'E')
                          if (writeCharacteristics) {
                            that.setData({isConntected:true})

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


    // var id = e.currentTarget.id, data = {};
    // for (var i = 0, len = type.length; i < len; ++i) {
    //     data[type[i] + 'Show'] = false;
    // }
    // data[id + 'Show'] = !this.data[id + 'Show'];
    // this.setData(data);
};
Page(pageData)