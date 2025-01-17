let generationCancel = false;
export const cancelGeneration = () => {
  generationCancel = true;
}

export const clearArray = (array) => {
  if (!array && array.length > 0) {
    array.splice(0, array.length)
  }
}

export const textNotEmpty = (message) => {
  if (message && message?.trim().length > 0) {
    return true;
  }
  return false;
};

export const fetchEvents = (url, textConsumer, data=null, headers={}, method='POST') => {
  generationCancel = false

  fetch(url, {
      method: method,
      headers: {...headers,
         'Content-Type': 'text/event-stream;chartset=UTF-8',
         'Connection': 'keep-alive',
         'Cache-Control': 'no-cache'
        },
      body: data
  })
  .then(response => {
      const reader = response.body.getReader()
      const textDecoder = new TextDecoder()
      const readChunk = () => {
        if (generationCancel) {
          reader.cancel()
          return
        }

        reader.read().then(({ value, done }) => {
          if (done || generationCancel) { 
            return
          }
          const text = textDecoder.decode(value)
          text.split('\n').forEach(line => {
            if (line.startsWith('event:')) {
              textConsumer(line.substring('event:'.length))
            } else if (line.startsWith('data:')) {
              textConsumer(line.substring('data:'.length))
            } else {
              if (line !== '') textConsumer(line)
            }
          })
          
          readChunk()
        }).catch(error => {
          console.error(error)
        })
      }
      readChunk()
    })
}

/**
 * In HTML, the image data is like 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...', however ollama only accepts the base64 data without the 'data:' prefix.
 * Provide this function to trim the 'data:' prefix.
 * @param {*} images 
 */
  export const trimImageMeta = (images) => {
    return images?.map(image => {
      if (image.startsWith('data:')) {
          return image.split(',')[1]
      } else {
          return image
      }
    })
  }

export const fireEndKey = () => {
    // 创建一个KeyboardEvent对象
    let eventKeyDown = new KeyboardEvent('keydown', {
        bubbles: true, // 事件是否冒泡
        cancelable: true, // 事件是否可以被取消
        keyCode: 35, // End键的keyCode
        which: 35, // 同keyCode，某些情况下也需要设置which属性
        key: 'End', // 键的字符表示
        code: 'End', // 对应于键盘布局的键码，这里使用'End'
        charCode: 0 // 非字符键可以设置为0
    });
    let eventKeyUp = new KeyboardEvent('keyup', {
      bubbles: true, // 事件是否冒泡
      cancelable: true, // 事件是否可以被取消
      keyCode: 35, // End键的keyCode
      which: 35, // 同keyCode，某些情况下也需要设置which属性
      key: 'End', // 键的字符表示
      code: 'End', // 对应于键盘布局的键码，这里使用'End'
      charCode: 0 // 非字符键可以设置为0
  });

    // 在指定元素上 dispatch 事件
    window.dispatchEvent(eventKeyDown);
    window.dispatchEvent(eventKeyUp);
}


export const formatDate = (dateStr) => {
  if (!dateStr) return ''

  if (dateStr.indexOf('T') > 0) {
      return new Date(Date.parse(dateStr)).toLocaleString()
  } else {
      return dateStr
  }
}

export const abbr = (str, maxSize) => {
  if (str && str.length > maxSize) {
      return str.substring(0, maxSize) + '..'
  } else {
      return str
  }
}

export const distinct = (value, index, self) => {
      return self.indexOf(value) === index
}