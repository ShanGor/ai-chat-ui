const urlObject = window.URL || window.webkitURL || window;

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

export const fetchEvents = (url, eventConsumer, data=null, headers={}, method='POST') => {
  generationCancel = false

  const options = {
      method: method,
      headers: {...headers,
          'Content-Type': 'text/event-stream;chartset=UTF-8',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
      },
      cors: 'no-cors'
  }
  if (data) {
      options.body = data
  }

  fetch(url, options).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

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
          let id=null
          let event = null
          let data=null
          const lines = text.split('\n')
          for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim()
              if (line.startsWith('event:')) {
                  event = (line.substring('event:'.length))
              } else if (line.startsWith('id:')) {
                  id = (line.substring('id:'.length))
              } else if (line.startsWith('data:')) {
                  data = line.substring('data:'.length)
                  eventConsumer({id: id, event: event, data: data})
                  id=null
                  event = null
                  data=null
              }
          }

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

export const formatDatetime = (date) => { // like `new Date()`
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const getCurrentTimeAsFormatted = () => {
      return formatDatetime(new Date())
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

export const saveJson = (obj, filename) => {
      // if object is a list, convert to object
      let blob
      if (Array.isArray(obj)) {
          blob = new Blob(obj.map(o => JSON.stringify(o) + '\n'), { type: 'application/json' })
      } else {
          blob = new Blob([JSON.stringify(obj)], { type: 'application/json' })
      }

      const url = urlObject.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      link.remove()
      urlObject.revokeObjectURL(url)
}

export const base64 = (arrayBuff) => {
      return btoa(String.fromCharCode(...new Uint8Array(arrayBuff)))
}

export const countCharacterOccurrences = (str, char) => {
    let count = 0
    for (let i=0; i<str.length; i++) {
        if (str[i] === char) {
            count++
        }
    }
    return count
}

export const parseCSV = (str, separator = ',') =>  {
    const arr = [];
    let quote = false;  // 'true' means we're inside a quoted field

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];        // Current character, next character
        arr[row] = arr[row] || [];             // Create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }

        // If it's just one quotation mark, begin/end quoted field
        if (cc === '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc === separator && !quote) { ++col; continue; }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc === '\n' && !quote) { ++row; col = 0; continue; }
        if (cc === '\r' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}